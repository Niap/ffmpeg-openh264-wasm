EM_VERSION=1.39.18-upstream
docker run \
  -v $PWD:/src \
  -itd \
  trzeci/emscripten:$EM_VERSION \
  /bin/bash