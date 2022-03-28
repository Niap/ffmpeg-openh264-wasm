BUILD_DIR=$PWD/build
FLAGS=(
  -I$BUILD_DIR/include -Iffmpeg
  -L$BUILD_DIR/lib
  -Wno-deprecated-declarations -Wno-pointer-sign -Wno-implicit-int-float-conversion -Wno-switch -Wno-parentheses -Qunused-arguments
  -lavdevice -lavfilter -lavformat -lavcodec -lswresample -lswscale -lavutil -lm
  src/cmdutils.c src/ffmpeg_opt.c src/ffmpeg_hw.c src/ffmpeg_filter.c src/ffmpeg.c
  -o example/converter.js
  -G
  -msimd128 
  -s USE_SDL=0                                  # use SDL2
  -s USE_PTHREADS=0                             # enable pthreads support
  -s PROXY_TO_PTHREAD=0                         # detach main() from browser/UI main thread
  -s INVOKE_RUN=0                               # not to run the main() in the beginning
  -s EXIT_RUNTIME=1                             # exit runtime after execution
  -s MODULARIZE=1                               # use modularized version to be more flexible
  -s EXPORT_NAME="createFFmpegCore"             # assign export name for browser
  -s EXPORTED_FUNCTIONS="[_main]"  # export main and proxy_main funcs
  -s EXPORTED_RUNTIME_METHODS="[FS, cwrap, ccall, setValue, writeAsciiToMemory]"   # export preamble funcs
  -s INITIAL_MEMORY=268435456                  # 64 KB * 1024 * 16 * 2047 = 2146435072 bytes ~= 2 GB
)
echo "FFMPEG_EM_FLAGS=${FLAGS[@]}"
emcc "${FLAGS[@]}"
