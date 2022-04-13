const parseArgs = (args) => {
    const argsPtr = _malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
    args.forEach((s, idx) => {
        const buf = _malloc(s.length + 1);
        writeAsciiToMemory(s, buf);
        setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
    });
    return [args.length, argsPtr];
  };


function receiveInstance(instance) {
    var exports = instance.exports;
    Module['asm'] = exports;
    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    assert(wasmMemory.buffer.byteLength === 268435456);
    updateGlobalBufferAndViews(wasmMemory.buffer);
    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");
    addOnInit(Module['asm']['__wasm_call_ctors']);
    removeRunDependency('wasm-instantiate');
}

var main = null;

self.importScripts('converter.js');

var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };

onmessage = (e)=>{
    // createConverter().then((Core)=>{
    const {command,params} = e.data;
    if( command == "ffmpeg" ){
        const {fileName,fileData,sourceType,targetType} = params;
        sourcePath = "/"+fileName+"."+sourceType;
        targetPath = "/"+fileName+"_out."+targetType;
        FS.writeFile(sourcePath, fileData);
        const args = ['ffmpeg', '-nostdin',"-i", sourcePath,  '-c','copy', targetPath];
        try{
            ccall(
                'main',
                'number',
                ['number', 'number'],
                parseArgs(args),
            );
        }catch(e){
            console.log(e);
        }
        var outputData = FS.readFile(targetPath);
        FS.unlink(sourcePath);
        FS.unlink(targetPath);
        postMessage({
            command:"ffmpeg",
            params:{
                fileName:fileName,
                targetType:targetType,
                videoData:outputData
            }
        });
    }else if(command == "ffprobe"){
        const {fileName,sourceType,fileData} = params;
        sourcePath = "/"+fileName+"."+sourceType;;
        targetPath = "/out.txt";
        FS.writeFile(sourcePath, fileData);
        const args = ['ffprobe',  '-print_format','json', '-show_format','-i', sourcePath];
        try{
            ccall(
                'main',
                'number',
                ['number', 'number'],
                parseArgs(args),
            );
        }catch(e){
            console.log(e);
        }
        var outputData = FS.readFile(targetPath);
        FS.unlink(sourcePath);
        FS.unlink(targetPath);
        var jsonStr = String.fromCharCode.apply(null, outputData);
        postMessage({
            command:"ffprobe",
            params: JSON.parse(jsonStr)
        });
    }else if(command == "load"){
        const binary = params;
        WebAssembly.instantiate(binary, info).then((data)=>{
            addRunDependency('wasm-instantiate');
            run();
            receiveInstance(data.instance)
            postMessage({
                command:"load",
                params:"下载完成"
            })
        })
    }
}
