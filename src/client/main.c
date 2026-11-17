#include "exam/build_info.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--version") == 0) {
        exam_print_build_info("exam-client");
        return EXIT_SUCCESS;
    }

    fprintf(stderr, "Usage: exam-client --version\n"
                    "Foundation target: socket/pipe processing is not implemented yet.\n");
    return EXIT_FAILURE;
}
