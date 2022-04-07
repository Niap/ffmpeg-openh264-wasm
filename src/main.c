#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>


int ffmpeg_main(int argc, char **argv);

int ffprobe_main(int argc, char **argv);

void clearFFmpegGlobal();
void clearFFprobeGlobal();

int main(int argc, char **argv){
    
    if( strcmp(argv[0],"ffmpeg") == 0 ){
        ffmpeg_main(argc,argv);
        clearFFmpegGlobal();
    }else if( strcmp(argv[0],"ffprobe") == 0 ){
        int oldfd;
        if((oldfd=open("/out.txt",O_RDWR|O_CREAT,0644))==-1)
        {
            printf("open error\n");
        }
        int newfd = dup2(oldfd,fileno(stdout));
        if( newfd ==-1)
        {
            printf("dup2 error\n");
        }
        ffprobe_main(argc,argv);
        close(newfd);
        close(oldfd);
        fprintf(stderr,"END");
        clearFFprobeGlobal();
    }
    return 0;
}


