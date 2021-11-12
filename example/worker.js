

const parseArgs = (args) => {
    const argsPtr = _malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
    args.forEach((s, idx) => {
        const buf = _malloc(s.length + 1);
        writeAsciiToMemory(s, buf);
        setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
    });
    return [args.length, argsPtr];
};
onmessage = function(e) {
    const fileData = e.data;
    const IN_FILE_NAME = '/video.mp4';
    FS.writeFile(IN_FILE_NAME, fileData);
    const outFile = "/out.mp4";
    const args = ["-i", IN_FILE_NAME, '-vf', 'scale=-2:360', '-c:v','h264', '-c:a', 'copy', outFile];
    console.time("a")
    try{
        ccall(
            'main',
            'number',
            ['number', 'number'],
            parseArgs(['ffmpeg', '-nostdin', ...args]),
        );
    }catch(e){
        
    }
    console.timeEnd("a")
    
    var video360File = FS.readFile(outFile);
    postMessage(video360File);
   
}

self.importScripts('ffmpeg-core.js');