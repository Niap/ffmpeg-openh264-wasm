

var asmLibraryArg = {
    "__assert_fail": ___assert_fail,
    "__clock_gettime": ___clock_gettime,
    "__gmtime_r": ___gmtime_r,
    "__localtime_r": ___localtime_r,
    "__syscall__newselect": ___syscall__newselect,
    "__syscall_accept4": ___syscall_accept4,
    "__syscall_access": ___syscall_access,
    "__syscall_bind": ___syscall_bind,
    "__syscall_connect": ___syscall_connect,
    "__syscall_dup3": ___syscall_dup3,
    "__syscall_fcntl64": ___syscall_fcntl64,
    "__syscall_fstat64": ___syscall_fstat64,
    "__syscall_fstatat64": ___syscall_fstatat64,
    "__syscall_getdents64": ___syscall_getdents64,
    "__syscall_getpeername": ___syscall_getpeername,
    "__syscall_getsockname": ___syscall_getsockname,
    "__syscall_getsockopt": ___syscall_getsockopt,
    "__syscall_getuid32": ___syscall_getuid32,
    "__syscall_ioctl": ___syscall_ioctl,
    "__syscall_listen": ___syscall_listen,
    "__syscall_lstat64": ___syscall_lstat64,
    "__syscall_mkdir": ___syscall_mkdir,
    "__syscall_open": ___syscall_open,
    "__syscall_poll": ___syscall_poll,
    "__syscall_recvfrom": ___syscall_recvfrom,
    "__syscall_rename": ___syscall_rename,
    "__syscall_rmdir": ___syscall_rmdir,
    "__syscall_sendto": ___syscall_sendto,
    "__syscall_socket": ___syscall_socket,
    "__syscall_stat64": ___syscall_stat64,
    "__syscall_unlink": ___syscall_unlink,
    "abort": _abort,
    "clock": _clock,
    "clock_gettime": _clock_gettime,
    "emscripten_get_heap_max": _emscripten_get_heap_max,
    "emscripten_get_now": _emscripten_get_now,
    "emscripten_memcpy_big": _emscripten_memcpy_big,
    "emscripten_resize_heap": _emscripten_resize_heap,
    "environ_get": _environ_get,
    "environ_sizes_get": _environ_sizes_get,
    "exit": _exit,
    "fd_close": _fd_close,
    "fd_fdstat_get": _fd_fdstat_get,
    "fd_read": _fd_read,
    "fd_seek": _fd_seek,
    "fd_write": _fd_write,
    "gai_strerror": _gai_strerror,
    "getaddrinfo": _getaddrinfo,
    "getnameinfo": _getnameinfo,
    "gettimeofday": _gettimeofday,
    "gmtime_r": _gmtime_r,
    "localtime_r": _localtime_r,
    "mktime": _mktime,
    "setTempRet0": _setTempRet0,
    "strftime": _strftime,
    "time": _time
  };
var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };

  var asm;

  function createExportWrapper(name) {
    return function() {
      if (!asm[name]) {
        console.log(asm[name], 'exported native function `' + displayName + '` not found');
      }
      return asm[name].apply(null, arguments);
    };
  }

var _malloc = createExportWrapper("malloc");

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    HEAP8 = new Int8Array(buf);
    HEAP16 = new Int16Array(buf);
    HEAP32 = new Int32Array(buf);
    HEAPU8 = new Uint8Array(buf);
    HEAPU16 = new Uint16Array(buf);
    HEAPU32 = new Uint32Array(buf);
    HEAPF32 = new Float32Array(buf);
    HEAPF64 = new Float64Array(buf);
  }
var _main = createExportWrapper("main");
const parseArgs = (args) => {
    const argsPtr = _malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
    args.forEach((s, idx) => {
        const buf = _malloc(s.length + 1);
        writeAsciiToMemory(s, buf);
        setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
    });
    return [args.length, argsPtr];
};
function ccall(ident, returnType, argTypes, args, opts) {
    // For fast lookup of conversion functions
    var toC = {
      'string': function(str) {
        var ret = 0;
        if (str !== null && str !== undefined && str !== 0) { // null string
          // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
          var len = (str.length << 2) + 1;
          ret = stackAlloc(len);
          stringToUTF8(str, ret, len);
        }
        return ret;
      },
      'array': function(arr) {
        var ret = stackAlloc(arr.length);
        writeArrayToMemory(arr, ret);
        return ret;
      }
    };
  
    function convertReturnValue(ret) {
      if (returnType === 'string') return UTF8ToString(ret);
      if (returnType === 'boolean') return Boolean(ret);
      return ret;
    }
  
    var func = _main;
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    function onDone(ret) {
      if (stack !== 0) stackRestore(stack);
      return convertReturnValue(ret);
    }
  
    ret = onDone(ret);
    return ret;
  }

fetch("./converter.wasm", { credentials: 'same-origin' }).then((response)=>{
    response.arrayBuffer().then((binary)=>{
        WebAssembly.instantiate(binary, info).then((data)=>{
            asm = data.instance.exports;
            updateGlobalBufferAndViews(asm.memory.buffer)
            var inputFile = "/video.mp4";
            ccall(
                'main',
                'number',
                ['number', 'number'],
                parseArgs(['ffmpeg','-nostdin', '-i', inputFile,'-c','copy', '/out.mp4']),
            );
            // Module.ccall(
            //     'main',
            //     'number',
            //     ['number', 'number'],
            //     parseArgs(['ffmpeg','-nostdin', '-i', inputFile,'-c','copy', '/out.mp4']),
            // );
            // var fileData = FS.readFile("/out.mp4");
        })
    })
    
})