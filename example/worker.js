const parseArgs = (Module,args) => {
    const argsPtr = Module._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
    args.forEach((s, idx) => {
        const buf = Module._malloc(s.length + 1);
        Module.writeAsciiToMemory(s, buf);
        Module.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
    });
    return [args.length, argsPtr];
};
self.importScripts('converter.js');
onmessage = (e)=>{
    // createConverter().then((Core)=>{
    const {command,params} = e.data;
    if( command == "ffmpeg" ){
        createConverter().then((Converter)=>{
            const {fileName,fileData,sourceType,targetType} = params;
            sourcePath = "/"+fileName+"."+sourceType;
            targetPath = "/"+fileName+"_out."+targetType;
            Converter.FS.writeFile(sourcePath, fileData);
            const args = ['ffmpeg', '-nostdin',"-i", sourcePath,  '-c','copy', targetPath];
            try{
                Converter.ccall(
                    'main',
                    'number',
                    ['number', 'number'],
                    parseArgs(Converter,args),
                );
            }catch(e){
                console.log(e);
            }
            var outputData = Converter.FS.readFile(targetPath);
            Converter.FS.unlink(sourcePath);
            Converter.FS.unlink(targetPath);
            postMessage({
                command:"ffmpeg",
                params:{
                    fileName:fileName,
                    targetType:targetType,
                    videoData:outputData
                }
            });
        })
       
    }else if(command == "ffprobe"){
        createConverter().then((Converter)=>{
            const {fileName,sourceType,fileData} = params;
            sourcePath = "/"+fileName+"."+sourceType;;
            targetPath = "/out.txt";
            Converter.FS.writeFile(sourcePath, fileData);
            const args = ['ffprobe',  '-print_format','json', '-show_format','-i', sourcePath];
            try{
                Converter.ccall(
                    'main',
                    'number',
                    ['number', 'number'],
                    parseArgs(Converter,args),
                );
            }catch(e){
                console.log(e);
            }
            var outputData = Converter.FS.readFile(targetPath);
            Converter.FS.unlink(sourcePath);
            Converter.FS.unlink(targetPath);
            var jsonStr = String.fromCharCode.apply(null, outputData);
            postMessage({
                command:"ffprobe",
                params: JSON.parse(jsonStr)
            });
        });
    }
}
