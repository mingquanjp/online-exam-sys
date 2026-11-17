#include "exam/build_info.h"

#include <cJSON.h>
#include <stdio.h>

void exam_print_build_info(const char *program_name) {
    fprintf(stderr, "%s %s (C11; cJSON %s; foundation only)\n",
            program_name, EXAM_VERSION, cJSON_Version());
}
