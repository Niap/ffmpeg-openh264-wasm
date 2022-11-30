BUILD_DIR=$PWD/build
CFLAGS="-s USE_PTHREADS=1 -O3 -msimd128 -I$BUILD_DIR/include"
LDFLAGS="$CFLAGS -L$BUILD_DIR/lib"
FLAGS=(
  --prefix="$BUILD_DIR" 
  --target-os=none        # use none to prevent any os specific configurations
  --arch=x86_32           # use x86_32 to achieve minimal architectural optimization
  --enable-cross-compile  # enable cross compile
  --disable-x86asm        # disable x86 asm
  --disable-inline-asm    # disable inline asm
  --disable-stripping     # disable stripping
  --disable-programs      # disable programs build (incl. ffplay, ffprobe & ffmpeg)
  --disable-doc           # disable doc
  --disable-debug         # disable debug info, required by closure
  --disable-runtime-cpudetect   # disable runtime cpu detect
  --disable-autodetect    # disable external libraries auto detect
  --disable-devices
  --disable-sdl2
  --disable-everything
  --extra-cflags="$CFLAGS"
  --extra-cxxflags="$CFLAGS"
  --extra-ldflags="$LDFLAGS"
  --pkg-config-flags="--static"
  --nm="llvm-nm"
  --ar=emar
  --ranlib=emranlib
  --cc=emcc
  --cxx=em++
  --objcc=emcc
  --dep-cc=emcc
  --enable-encoders
  --enable-decoders
  --enable-demuxers
  --enable-muxers
  --enable-protocols
  --enable-filters
  --enable-libmp3lame
  --enable-libopenh264
  #--enable-muxer=mp3,aac,mp4,image2,apng,gif
  #--enable-encoder=libopenh264,mjpeg,libmp3lame,aac
  #--enable-filter=scale,thumbnail,amix,aresample,aformat,asetnsamples,apad,split,palettegen,paletteuse,tile,volume,anull
  #--enable-decoder=libopenh264,mp3,aac
  #--enable-demuxer=mov,mp4,m4a,3gp,3g2,mj2,avi
)

cd ffmpeg
echo "FFMPEG_CONFIG_FLAGS=${FLAGS[@]}"
EM_PKG_CONFIG_PATH=${EM_PKG_CONFIG_PATH} emconfigure ./configure "${FLAGS[@]}"
emmake make install -j 10
cd ..