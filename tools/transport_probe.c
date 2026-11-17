/* Loopback transport probe only: no auth, SQLite, domain logic or production JSON.
 * One nonblocking poll loop echoes length-prefixed frames to concurrent clients.
 */
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/tcp.h>
#include <poll.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/resource.h>
#include <sys/socket.h>
#include <unistd.h>

#define CLIENTS 64
#define FRAME_MAX 65536
#define RX_MAX (FRAME_MAX + 4)
#define TX_MAX (2 * RX_MAX)
typedef struct {
    unsigned char rx[RX_MAX], tx[TX_MAX];
    size_t nr, nt, offset;
} Buffers;
static Buffers buffers[CLIENTS];
static void fail(const char *s) { perror(s); exit(1); }
static void nonblock(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags < 0 || fcntl(fd, F_SETFL, flags | O_NONBLOCK) < 0) fail("fcntl");
}
static int parse(Buffers *b) {
    while (b->nr >= 4) {
        uint32_t net;
        memcpy(&net, b->rx, 4);
        size_t n = ntohl(net);
        if (n == 0 || n > FRAME_MAX) return -1;
        if (b->nr < n + 4 || TX_MAX - b->nt < n + 4) return 0;
        memcpy(b->tx + b->nt, b->rx, n + 4);
        b->nt += n + 4;
        b->nr -= n + 4;
        memmove(b->rx, b->rx + n + 4, b->nr);
    }
    return 0;
}
int main(void) {
    signal(SIGPIPE, SIG_IGN);
    int listener = socket(AF_INET, SOCK_STREAM, 0);
    if (listener < 0) fail("socket");
    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    if (bind(listener, (struct sockaddr *)&addr, sizeof addr) < 0) fail("bind");
    if (listen(listener, CLIENTS) < 0) fail("listen");
    nonblock(listener);
    socklen_t size = sizeof addr;
    if (getsockname(listener, (struct sockaddr *)&addr, &size) < 0) fail("getsockname");
    printf("%u\n", (unsigned)ntohs(addr.sin_port));
    fflush(stdout);
    struct pollfd fds[CLIENTS + 1];
    fds[0] = (struct pollfd){listener, POLLIN, 0};
    for (int i = 1; i <= CLIENTS; i++) fds[i] = (struct pollfd){-1, 0, 0};
    unsigned accepted = 0, active = 0, peak = 0;
    unsigned long long sent_bytes = 0;
    for (;;) {
        for (int i = 1; i <= CLIENTS; i++) {
            Buffers *b = &buffers[i-1];
            fds[i].events = ((b->nr < RX_MAX && b->nt < TX_MAX) ? POLLIN : 0)
                          | ((b->nt > b->offset) ? POLLOUT : 0);
        }
        int rc = poll(fds, CLIENTS + 1, 1000);
        if (rc < 0) { if (errno == EINTR) continue; fail("poll"); }
        if (fds[0].revents & POLLIN) {
            for (;;) {
                int fd = accept(listener, NULL, NULL);
                if (fd < 0) {
                    if (errno == EAGAIN || errno == EWOULDBLOCK) break;
                    if (errno == EINTR) continue;
                    fail("accept");
                }
                nonblock(fd);
                int one = 1;
                if (setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &one, sizeof one) < 0) fail("nodelay");
                int slot;
                for (slot = 1; slot <= CLIENTS && fds[slot].fd >= 0; slot++) {}
                if (slot > CLIENTS) { close(fd); continue; }
                memset(&buffers[slot-1], 0, sizeof(Buffers));
                fds[slot] = (struct pollfd){fd, POLLIN, 0};
                accepted++; active++;
                if (active > peak) peak = active;
            }
        }
        for (int i = 1; i <= CLIENTS; i++) {
            if (fds[i].fd < 0) continue;
            Buffers *b = &buffers[i-1];
            int close_it = 0;
            if (fds[i].revents & POLLIN) {
                ssize_t n = recv(fds[i].fd, b->rx + b->nr, RX_MAX - b->nr, 0);
                if (n > 0) { b->nr += (size_t)n; close_it = parse(b) < 0; }
                else if (n == 0) close_it = 1;
                else if (errno != EAGAIN && errno != EWOULDBLOCK && errno != EINTR) close_it = 1;
            }
            if (!close_it && (fds[i].revents & POLLOUT) && b->nt > b->offset) {
                ssize_t n = send(fds[i].fd, b->tx + b->offset, b->nt - b->offset, 0);
                if (n > 0) {
                    b->offset += (size_t)n; sent_bytes += (unsigned long long)n;
                    if (b->offset == b->nt) { b->offset = 0; b->nt = 0; }
                    close_it = parse(b) < 0;
                } else if (n < 0 && errno != EAGAIN && errno != EWOULDBLOCK && errno != EINTR) close_it = 1;
            }
            if (fds[i].revents & (POLLERR | POLLNVAL)) close_it = 1;
            if ((fds[i].revents & POLLHUP) && !(fds[i].revents & POLLIN)) close_it = 1;
            if (close_it) { close(fds[i].fd); fds[i].fd = -1; active--; }
        }
        if (accepted && !active) break;
    }
    struct rusage usage;
    if (getrusage(RUSAGE_SELF, &usage) < 0) fail("getrusage");
    printf("{\"accepted\":%u,\"peak_connections\":%u,\"echoed_bytes_including_headers\":%llu,\"cpu_user_s\":%.6f,\"cpu_system_s\":%.6f}\n",
        accepted, peak, sent_bytes,
        usage.ru_utime.tv_sec + usage.ru_utime.tv_usec/1e6,
        usage.ru_stime.tv_sec + usage.ru_stime.tv_usec/1e6);
    close(listener);
    return 0;
}
