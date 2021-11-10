LIB_PATH=openh264
CFLAGS="-s USE_PTHREADS=1 -O3 -msimd128 -fno-stack-protector"
LDFLAGS="$CFLAGS" 
BUILD_DIR=$PWD/build
CFLAGS=${CFLAGS} CXXFLAGS=${CFLAGS} LDFLAGS=${LDFLAGS} emmake make -C $LIB_PATH install-static PREFIX=${BUILD_DIR} OS=linux ARCH=asmjs