#include "exam/build_info.h"

#include <sodium.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--version") == 0) {
        if (sodium_init() < 0) {
            fprintf(stderr, "libsodium initialization failed.\n");
            return EXIT_FAILURE;
        }
        exam_print_build_info("exam-server");
        fprintf(stderr, "TCP transport foundation; libsodium %s\n",
                sodium_version_string());
        return EXIT_SUCCESS;
    }

    fprintf(stderr, "Usage: exam-server --version\n"
                    "Foundation target: listener and business child startup are pending.\n");
    return EXIT_FAILURE;
}
