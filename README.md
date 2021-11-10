# How to build
> target os:macos 11.6
> Emcc:2.0.29
## step1
run script build_openh264.sh
check build/lib/openh254.a file esists represents success.

## step2
run script build_lame.sh
check build/lib/libmp3lame.a file esists represents success.

## step3
modify ffmpeg/configure file

add code 
```
pkg_config=../fake-pkg-config
```
after pkg_config_fail_message if else segment. around line 4411

## step4
modify ffmpeg/fftools/cmdutils.c
add code
```
 /*
    * Print an unique message here to detect
    * end of operation in JavaScript.
    */
printf("FFMPEG_END\n");
```

in function "exit_program" before exit(ret);

## step5
run script build_libffmpeg.sh
check build/lib/libav*.a & libsw*.a file esists represents success.

## step6
run script build_ffmpeg.sh
check ffmpeg-core.wasm represents success.

# How to use

This repo just a replacement of https://github.com/ffmpegwasm/ffmpeg.wasm-core ,You can use ffmepg.wasm as caller. 