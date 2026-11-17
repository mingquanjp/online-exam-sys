include(FetchContent)

# Versioned archives plus SHA-256: dependencies never track a moving branch.
FetchContent_Declare(cjson_source
    URL https://codeload.github.com/DaveGamble/cJSON/tar.gz/refs/tags/v1.7.19
    URL_HASH SHA256=7fa616e3046edfa7a28a32d5f9eacfd23f92900fe1f8ccd988c1662f30454562
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    SOURCE_SUBDIR exam-source-only)

# These archives are used as source only; avoid changing options in upstream projects.
FetchContent_MakeAvailable(cjson_source)

add_library(exam_cjson STATIC "${cjson_source_SOURCE_DIR}/cJSON.c")
target_include_directories(exam_cjson SYSTEM PUBLIC "${cjson_source_SOURCE_DIR}")
target_link_libraries(exam_cjson PUBLIC m)

# libsodium comes from the OS package manager (no hand-written crypto or global installer).
find_path(SODIUM_INCLUDE_DIR NAMES sodium.h)
find_library(SODIUM_LIBRARY NAMES sodium)
if(NOT SODIUM_INCLUDE_DIR OR NOT SODIUM_LIBRARY)
    message(FATAL_ERROR
        "libsodium development files not found. Linux: install libsodium-dev. "
        "macOS: brew install libsodium. Custom prefix: -DCMAKE_PREFIX_PATH=/path/to/prefix")
endif()
file(STRINGS "${SODIUM_INCLUDE_DIR}/sodium/version.h" sodium_version_line
    REGEX "^#define SODIUM_VERSION_STRING ")
string(REGEX MATCH "[0-9]+\\.[0-9]+\\.[0-9]+" SODIUM_VERSION "${sodium_version_line}")
if(NOT SODIUM_VERSION OR SODIUM_VERSION VERSION_LESS "1.0.18")
    message(FATAL_ERROR "libsodium >= 1.0.18 is required; found '${SODIUM_VERSION}'.")
endif()
add_library(sodium::sodium UNKNOWN IMPORTED)
set_target_properties(sodium::sodium PROPERTIES
    IMPORTED_LOCATION "${SODIUM_LIBRARY}"
    INTERFACE_INCLUDE_DIRECTORIES "${SODIUM_INCLUDE_DIR}")
message(STATUS "Native dependencies: cJSON 1.7.19, libsodium ${SODIUM_VERSION}")
