cmake_minimum_required(VERSION 3.24)
project(online_exam_sys VERSION 0.1.0 LANGUAGES C)

if(NOT UNIX)
    message(FATAL_ERROR "The native targets require POSIX. Use Linux (or macOS for development).")
endif()

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

include(cmake/Dependencies.cmake)

add_library(exam_build_options INTERFACE)
target_compile_definitions(exam_build_options INTERFACE _POSIX_C_SOURCE=200809L)
target_compile_options(exam_build_options INTERFACE
    $<$<C_COMPILER_ID:GNU,Clang,AppleClang>:-Wall;-Wextra;-Wpedantic;-Werror>)

add_library(exam_common STATIC src/common/build_info.c)
target_include_directories(exam_common PUBLIC src/common/include)
target_link_libraries(exam_common PUBLIC exam_build_options PRIVATE exam_cjson)
target_compile_definitions(exam_common PRIVATE EXAM_VERSION="${PROJECT_VERSION}")

add_executable(exam-client src/client/main.c)
target_link_libraries(exam-client PRIVATE exam_common)

add_executable(exam-server src/server/main.c)
target_link_libraries(exam-server PRIVATE exam_common sodium::sodium)

include(CTest)
if(BUILD_TESTING)
    add_test(NAME foundation.client-version COMMAND exam-client --version)
    add_test(NAME foundation.server-version COMMAND exam-server --version)
endif()
