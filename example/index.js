(function() {
  Module.ready = new Promise((resolve, reject) => {
    addOnPreMain(() => {
      resolve();
    });

    // Propagate error to Module.ready().catch()
    // WARNING: this is a hack based Emscripten's current abort() implementation
    // and could break in the future.
    // Rewrite existing abort(what) function to reject Promise before it executes.
    var origAbort = Module.abort;
    Module.abort = function(what) {
      reject(Error(what));
      origAbort.call(this, what);
    }
  });
})();

const parseArgs = (args) => {
  const argsPtr = Module._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((s, idx) => {
      const buf = Module._malloc(s.length + 1);
      Module.writeAsciiToMemory(s, buf);
      Module.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
  });
  return [args.length, argsPtr];
};

const s = (fileData)=>{
  var inputFile = "/video.mp4";
  FS.writeFile(inputFile, new Uint8Array(fileData));
  Module.ccall(
    'main',
    'number',
    ['number', 'number'],
    parseArgs(['ffmpeg','-nostdin', '-i', inputFile,'-c','copy', '/out.mp4']),
  );
  var fileData = FS.readFile("/out.mp4");
  //debugger;
  // var str = String.fromCharCode.apply(null, fileData);
  // console.log(str);
}