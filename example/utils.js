const readFromBlobOrFile = (blob) => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({ target: { error: { code } } }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  })
);

const runFFmpeg = (ifilename, data, args, ofilename, extraFiles = []) => {
  let resolve = null;
  let file = null;
  // const Core = await createFFmpegCore({
  //   printErr: (m) => {
  //     console.log(m);
  //   },
  //   print: (m) => {
  //     console.log(m);
  //   },
  // });
  FS.writeFile(ifilename, data);
  ffmpeg(args);
  //await new Promise((_resolve) => { resolve = _resolve });
  if (typeof ofilename !== 'undefined') {
    file = FS.readFile(ofilename);
    FS.unlink(ofilename);
  }
  return {file };
};




const ffmpeg = (args) => {
  ccall(
    'main',
    'number',
    ['number', 'number'],
    parseArgs(['ffmpeg', '-nostdin', ...args]),
  );
};


const parseArgs = (args) => {
  const argsPtr = _malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((s, idx) => {
    const buf = _malloc(s.length + 1);
    writeAsciiToMemory(s, buf);
    setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
  });
  return [args.length, argsPtr];
};


const b64ToUint8Array = (str) => (Uint8Array.from(atob(str), c => c.charCodeAt(0)));
