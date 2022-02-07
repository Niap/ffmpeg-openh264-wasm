function ___assert_fail(condition, filename, line, func) {
    abort('Assertion failed: ' + UTF8ToString(condition) + ', at: ' + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
}
function _clock_gettime(clk_id, tp) {
    // int clock_gettime(clockid_t clk_id, struct timespec *tp);
    var now;
    if (clk_id === 0) {
      now = Date.now();
    } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
      now = _emscripten_get_now();
    } else {
      setErrNo(28);
      return -1;
    }
    HEAP32[((tp)>>2)] = (now/1000)|0; // seconds
    HEAP32[(((tp)+(4))>>2)] = ((now % 1000)*1000*1000)|0; // nanoseconds
    return 0;
  }
function ___clock_gettime(a0,a1
) {
return _clock_gettime(a0,a1);
}

function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[((time)>>2)]*1000);
    HEAP32[((tmPtr)>>2)] = date.getUTCSeconds();
    HEAP32[(((tmPtr)+(4))>>2)] = date.getUTCMinutes();
    HEAP32[(((tmPtr)+(8))>>2)] = date.getUTCHours();
    HEAP32[(((tmPtr)+(12))>>2)] = date.getUTCDate();
    HEAP32[(((tmPtr)+(16))>>2)] = date.getUTCMonth();
    HEAP32[(((tmPtr)+(20))>>2)] = date.getUTCFullYear()-1900;
    HEAP32[(((tmPtr)+(24))>>2)] = date.getUTCDay();
    HEAP32[(((tmPtr)+(36))>>2)] = 0;
    HEAP32[(((tmPtr)+(32))>>2)] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
    HEAP32[(((tmPtr)+(28))>>2)] = yday;
    // Allocate a string "GMT" for us to point to.
    if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8("GMT");
    HEAP32[(((tmPtr)+(40))>>2)] = _gmtime_r.GMTString;
    return tmPtr;
  }
function ___gmtime_r(a0,a1
) {
return _gmtime_r(a0,a1);
}

function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[((time)>>2)]*1000);
    HEAP32[((tmPtr)>>2)] = date.getSeconds();
    HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
    HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
    HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
    HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();
    HEAP32[(((tmPtr)+(20))>>2)] = date.getFullYear()-1900;
    HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();

    var start = new Date(date.getFullYear(), 0, 1);
    var yday = ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))|0;
    HEAP32[(((tmPtr)+(28))>>2)] = yday;
    HEAP32[(((tmPtr)+(36))>>2)] = -(date.getTimezoneOffset() * 60);

    // Attention: DST is in December in South, and some regions don't have DST at all.
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
    HEAP32[(((tmPtr)+(32))>>2)] = dst;

    var zonePtr = HEAP32[(((__get_tzname())+(dst ? 4 : 0))>>2)];
    HEAP32[(((tmPtr)+(40))>>2)] = zonePtr;

    return tmPtr;
  }
function ___localtime_r(a0,a1
) {
return _localtime_r(a0,a1);
}

function ___syscall__newselect(nfds, readfds, writefds, exceptfds, timeout) {try {
  
    // readfds are supported,
    // writefds checks socket open status
    // exceptfds not supported
    // timeout is always 0 - fully async
    assert(nfds <= 64, 'nfds must be less than or equal to 64');  // fd sets have 64 bits // TODO: this could be 1024 based on current musl headers
    assert(!exceptfds, 'exceptfds not supported');

    var total = 0;
    
    var srcReadLow = (readfds ? HEAP32[((readfds)>>2)] : 0),
        srcReadHigh = (readfds ? HEAP32[(((readfds)+(4))>>2)] : 0);
    var srcWriteLow = (writefds ? HEAP32[((writefds)>>2)] : 0),
        srcWriteHigh = (writefds ? HEAP32[(((writefds)+(4))>>2)] : 0);
    var srcExceptLow = (exceptfds ? HEAP32[((exceptfds)>>2)] : 0),
        srcExceptHigh = (exceptfds ? HEAP32[(((exceptfds)+(4))>>2)] : 0);

    var dstReadLow = 0,
        dstReadHigh = 0;
    var dstWriteLow = 0,
        dstWriteHigh = 0;
    var dstExceptLow = 0,
        dstExceptHigh = 0;

    var allLow = (readfds ? HEAP32[((readfds)>>2)] : 0) |
                 (writefds ? HEAP32[((writefds)>>2)] : 0) |
                 (exceptfds ? HEAP32[((exceptfds)>>2)] : 0);
    var allHigh = (readfds ? HEAP32[(((readfds)+(4))>>2)] : 0) |
                  (writefds ? HEAP32[(((writefds)+(4))>>2)] : 0) |
                  (exceptfds ? HEAP32[(((exceptfds)+(4))>>2)] : 0);

    var check = function(fd, low, high, val) {
      return (fd < 32 ? (low & val) : (high & val));
    };

    for (var fd = 0; fd < nfds; fd++) {
      var mask = 1 << (fd % 32);
      if (!(check(fd, allLow, allHigh, mask))) {
        continue;  // index isn't in the set
      }

      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(8);

      var flags = SYSCALLS.DEFAULT_POLLMASK;

      if (stream.stream_ops.poll) {
        flags = stream.stream_ops.poll(stream);
      }

      if ((flags & 1) && check(fd, srcReadLow, srcReadHigh, mask)) {
        fd < 32 ? (dstReadLow = dstReadLow | mask) : (dstReadHigh = dstReadHigh | mask);
        total++;
      }
      if ((flags & 4) && check(fd, srcWriteLow, srcWriteHigh, mask)) {
        fd < 32 ? (dstWriteLow = dstWriteLow | mask) : (dstWriteHigh = dstWriteHigh | mask);
        total++;
      }
      if ((flags & 2) && check(fd, srcExceptLow, srcExceptHigh, mask)) {
        fd < 32 ? (dstExceptLow = dstExceptLow | mask) : (dstExceptHigh = dstExceptHigh | mask);
        total++;
      }
    }

    if (readfds) {
      HEAP32[((readfds)>>2)] = dstReadLow;
      HEAP32[(((readfds)+(4))>>2)] = dstReadHigh;
    }
    if (writefds) {
      HEAP32[((writefds)>>2)] = dstWriteLow;
      HEAP32[(((writefds)+(4))>>2)] = dstWriteHigh;
    }
    if (exceptfds) {
      HEAP32[((exceptfds)>>2)] = dstExceptLow;
      HEAP32[(((exceptfds)+(4))>>2)] = dstExceptHigh;
    }
    
    return total;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_accept4(fd, addr, addrlen, flags) {try {
  
    var sock = getSocketFromFD(fd);
    var newsock = sock.sock_ops.accept(sock);
    if (addr) {
      var errno = writeSockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport, addrlen);
      assert(!errno);
    }
    return newsock.stream.fd;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_access(path, amode) {try {
  
    path = SYSCALLS.getStr(path);
    return SYSCALLS.doAccess(path, amode);
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_bind(fd, addr, addrlen) {try {
  
    var sock = getSocketFromFD(fd);
    var info = getSocketAddress(addr, addrlen);
    sock.sock_ops.bind(sock, info.addr, info.port);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}


function ___syscall_connect(fd, addr, addrlen) {try {
  
    var sock = getSocketFromFD(fd);
    var info = getSocketAddress(addr, addrlen);
    sock.sock_ops.connect(sock, info.addr, info.port);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}


function ___syscall_dup3(fd, suggestFD, flags) {try {
  
    var old = SYSCALLS.getStreamFromFD(fd);
    assert(!flags);
    if (old.fd === suggestFD) return -28;
    return SYSCALLS.doDup(old.path, old.flags, suggestFD);
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_fcntl64(fd, cmd, varargs) {SYSCALLS.varargs = varargs;
    try {
    
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
          case 0: {
            var arg = SYSCALLS.get();
            if (arg < 0) {
              return -28;
            }
            var newStream;
            newStream = FS.open(stream.path, stream.flags, 0, arg);
            return newStream.fd;
          }
          case 1:
          case 2:
            return 0;  // FD_CLOEXEC makes no sense for a single process.
          case 3:
            return stream.flags;
          case 4: {
            var arg = SYSCALLS.get();
            stream.flags |= arg;
            return 0;
          }
          case 5:
          /* case 5: Currently in musl F_GETLK64 has same value as F_GETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */ {
            
            var arg = SYSCALLS.get();
            var offset = 0;
            // We're always unlocked.
            HEAP16[(((arg)+(offset))>>1)] = 2;
            return 0;
          }
          case 6:
          case 7:
          /* case 6: Currently in musl F_SETLK64 has same value as F_SETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
          /* case 7: Currently in musl F_SETLKW64 has same value as F_SETLKW, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
            
            
            return 0; // Pretend that the locking is successful.
          case 16:
          case 8:
            return -28; // These are for sockets. We don't have them fully implemented yet.
          case 9:
            // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
            setErrNo(28);
            return -1;
          default: {
            return -28;
          }
        }
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_fstat64(fd, buf) {try {
  
        var stream = SYSCALLS.getStreamFromFD(fd);
        return SYSCALLS.doStat(FS.stat, stream.path, buf);
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_fstatat64(dirfd, path, buf, flags) {try {
  
        path = SYSCALLS.getStr(path);
        var nofollow = flags & 256;
        var allowEmpty = flags & 4096;
        flags = flags & (~4352);
        assert(!flags, flags);
        path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
        return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_getdents64(fd, dirp, count) {try {
  
        var stream = SYSCALLS.getStreamFromFD(fd)
        if (!stream.getdents) {
          stream.getdents = FS.readdir(stream.path);
        }
    
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
    
        var idx = Math.floor(off / struct_size);
    
        while (idx < stream.getdents.length && pos + struct_size <= count) {
          var id;
          var type;
          var name = stream.getdents[idx];
          if (name === '.') {
            id = stream.id;
            type = 4; // DT_DIR
          }
          else if (name === '..') {
            var lookup = FS.lookupPath(stream.path, { parent: true });
            id = lookup.node.id;
            type = 4; // DT_DIR
          }
          else {
            var child = FS.lookupNode(stream, name);
            id = child.id;
            type = FS.isChrdev(child.mode) ? 2 :  // DT_CHR, character device.
                   FS.isDir(child.mode) ? 4 :     // DT_DIR, directory.
                   FS.isLink(child.mode) ? 10 :   // DT_LNK, symbolic link.
                   8;                             // DT_REG, regular file.
          }
          assert(id);
          (tempI64 = [id>>>0,(tempDouble=id,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((dirp + pos)>>2)] = tempI64[0],HEAP32[(((dirp + pos)+(4))>>2)] = tempI64[1]);
          (tempI64 = [(idx + 1) * struct_size>>>0,(tempDouble=(idx + 1) * struct_size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((dirp + pos)+(8))>>2)] = tempI64[0],HEAP32[(((dirp + pos)+(12))>>2)] = tempI64[1]);
          HEAP16[(((dirp + pos)+(16))>>1)] = 280;
          HEAP8[(((dirp + pos)+(18))>>0)] = type;
          stringToUTF8(name, dirp + pos + 19, 256);
          pos += struct_size;
          idx += 1;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_getpeername(fd, addr, addrlen) {try {
  
        var sock = getSocketFromFD(fd);
        if (!sock.daddr) {
          return -53; // The socket is not connected.
        }
        var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport, addrlen);
        assert(!errno);
        return 0;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_getsockname(fd, addr, addrlen) {try {
  
        err("__syscall_getsockname " + fd);
        var sock = getSocketFromFD(fd);
        // TODO: sock.saddr should never be undefined, see TODO in websocket_sock_ops.getname
        var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || '0.0.0.0'), sock.sport, addrlen);
        assert(!errno);
        return 0;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_getsockopt(fd, level, optname, optval, optlen) {try {
  
        var sock = getSocketFromFD(fd);
        // Minimal getsockopt aimed at resolving https://github.com/emscripten-core/emscripten/issues/2211
        // so only supports SOL_SOCKET with SO_ERROR.
        if (level === 1) {
          if (optname === 4) {
            HEAP32[((optval)>>2)] = sock.error;
            HEAP32[((optlen)>>2)] = 4;
            sock.error = null; // Clear the error (The SO_ERROR option obtains and then clears this field).
            return 0;
          }
        }
        return -50; // The option is unknown at the level indicated.
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }

    function ___syscall_getegid32() {
        return 0;
      }
    function ___syscall_getuid32(
    ) {
    return ___syscall_getegid32();
    }


    function ___syscall_ioctl(fd, op, varargs) {SYSCALLS.varargs = varargs;
        try {
        
            var stream = SYSCALLS.getStreamFromFD(fd);
            switch (op) {
              case 21509:
              case 21505: {
                if (!stream.tty) return -59;
                return 0;
              }
              case 21510:
              case 21511:
              case 21512:
              case 21506:
              case 21507:
              case 21508: {
                if (!stream.tty) return -59;
                return 0; // no-op, not actually adjusting terminal settings
              }
              case 21519: {
                if (!stream.tty) return -59;
                var argp = SYSCALLS.get();
                HEAP32[((argp)>>2)] = 0;
                return 0;
              }
              case 21520: {
                if (!stream.tty) return -59;
                return -28; // not supported
              }
              case 21531: {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp);
              }
              case 21523: {
                // TODO: in theory we should write to the winsize struct that gets
                // passed in, but for now musl doesn't read anything on it
                if (!stream.tty) return -59;
                return 0;
              }
              case 21524: {
                // TODO: technically, this ioctl call should change the window size.
                // but, since emscripten doesn't have any concept of a terminal window
                // yet, we'll just silently throw it away as we do TIOCGWINSZ
                if (!stream.tty) return -59;
                return 0;
              }
              default: abort('bad ioctl syscall ' + op);
            }
          } catch (e) {
          if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
          return -e.errno;
        }
        }

        function ___syscall_listen(fd, backlog) {try {
  
            var sock = getSocketFromFD(fd);
            sock.sock_ops.listen(sock, backlog);
            return 0;
          } catch (e) {
          if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
          return -e.errno;
        }
        }

        function ___syscall_lstat64(path, buf) {try {
  
            path = SYSCALLS.getStr(path);
            return SYSCALLS.doStat(FS.lstat, path, buf);
          } catch (e) {
          if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
          return -e.errno;
        }
        }


  function ___syscall_mkdir(path, mode) {try {
  
    path = SYSCALLS.getStr(path);
    return SYSCALLS.doMkdir(path, mode);
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_open(path, flags, varargs) {SYSCALLS.varargs = varargs;
    try {
    
        var pathname = SYSCALLS.getStr(path);
        var mode = varargs ? SYSCALLS.get() : 0;
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
      return -e.errno;
    }
    }


  function ___syscall_poll(fds, nfds, timeout) {try {
  
    var nonzero = 0;
    for (var i = 0; i < nfds; i++) {
      var pollfd = fds + 8 * i;
      var fd = HEAP32[((pollfd)>>2)];
      var events = HEAP16[(((pollfd)+(4))>>1)];
      var mask = 32;
      var stream = FS.getStream(fd);
      if (stream) {
        mask = SYSCALLS.DEFAULT_POLLMASK;
        if (stream.stream_ops.poll) {
          mask = stream.stream_ops.poll(stream);
        }
      }
      mask &= events | 8 | 16;
      if (mask) nonzero++;
      HEAP16[(((pollfd)+(6))>>1)] = mask;
    }
    return nonzero;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {try {
  
    var sock = getSocketFromFD(fd);
    var msg = sock.sock_ops.recvmsg(sock, len);
    if (!msg) return 0; // socket is closed
    if (addr) {
      var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
      assert(!errno);
    }
    HEAPU8.set(msg.buffer, buf);
    return msg.buffer.byteLength;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}


function ___syscall_rename(old_path, new_path) {try {
  
    old_path = SYSCALLS.getStr(old_path);
    new_path = SYSCALLS.getStr(new_path);
    FS.rename(old_path, new_path);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_rmdir(path) {try {

    path = SYSCALLS.getStr(path);
    FS.rmdir(path);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {try {

    var sock = getSocketFromFD(fd);
    var dest = getSocketAddress(addr, addr_len, true);
    if (!dest) {
      // send, no address provided
      return FS.write(sock.stream, HEAP8,message, length);
    } else {
      // sendto an address
      return sock.sock_ops.sendmsg(sock, HEAP8,message, length, dest.addr, dest.port);
    }
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}


function ___syscall_socket(domain, type, protocol) {try {
  
    var sock = SOCKFS.createSocket(domain, type, protocol);
    assert(sock.stream.fd < 64); // XXX ? select() assumes socket fd values are in 0..63
    return sock.stream.fd;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_stat64(path, buf) {try {

    path = SYSCALLS.getStr(path);
    return SYSCALLS.doStat(FS.stat, path, buf);
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}

function ___syscall_unlink(path) {try {

    path = SYSCALLS.getStr(path);
    FS.unlink(path);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
}
}


function _abort() {
    abort('native code called abort()');
  }

function _clock() {
    if (_clock.start === undefined) _clock.start = Date.now();
    return ((Date.now() - _clock.start) * (1000000 / 1000))|0;
  }



  function _emscripten_get_heap_max() {
    return HEAPU8.length;
  }


function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num);
  }

function abortOnCannotGrowMemory(requestedSize) {
    abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
  }
function _emscripten_resize_heap(requestedSize) {
    var oldSize = HEAPU8.length;
    requestedSize = requestedSize >>> 0;
    abortOnCannotGrowMemory(requestedSize);
  }

  function _emscripten_get_now(){ 
      return performance.now();
  }
  
  function _environ_get(__environ, environ_buf) {
    var bufSize = 0;
    getEnvStrings().forEach(function(string, i) {
      var ptr = environ_buf + bufSize;
      HEAP32[(((__environ)+(i * 4))>>2)] = ptr;
      writeAsciiToMemory(string, ptr);
      bufSize += string.length + 1;
    });
    return 0;
  }

  function _environ_sizes_get(penviron_count, penviron_buf_size) {
    var strings = getEnvStrings();
    HEAP32[((penviron_count)>>2)] = strings.length;
    var bufSize = 0;
    strings.forEach(function(string) {
      bufSize += string.length + 1;
    });
    HEAP32[((penviron_buf_size)>>2)] = bufSize;
    return 0;
  }
  function _exit(status) {
    // void _exit(int status);
    // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
    exit(status);
  }

  function _fd_close(fd) {try {
  
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
}
}

function _fd_fdstat_get(fd, pbuf) {try {
  ///????
    // var stream = SYSCALLS.getStreamFromFD(fd);
    // // All character devices are terminals (other things a Linux system would
    // // assume is a character device, like the mouse, we have special APIs for).
    // var type = stream.tty ? 2 :
    //            FS.isDir(stream.mode) ? 3 :
    //            FS.isLink(stream.mode) ? 7 :
    //            4;
    // HEAP8[((pbuf)>>0)] = type;
    // TODO HEAP16[(((pbuf)+(2))>>1)] = ?;
    // TODO (tempI64 = [?>>>0,(tempDouble=?,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((pbuf)+(8))>>2)] = tempI64[0],HEAP32[(((pbuf)+(12))>>2)] = tempI64[1]);
    // TODO (tempI64 = [?>>>0,(tempDouble=?,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((pbuf)+(16))>>2)] = tempI64[0],HEAP32[(((pbuf)+(20))>>2)] = tempI64[1]);
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
}
}

function _fd_read(fd, iov, iovcnt, pnum) {try {
  
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = SYSCALLS.doReadv(stream, iov, iovcnt);
    HEAP32[((pnum)>>2)] = num;
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
}
}


function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var HIGH_OFFSET = 0x100000000; // 2^32
    // use an unsigned operator on low and shift high by 32-bits
    var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);

    var DOUBLE_LIMIT = 0x20000000000000; // 2^53
    // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
    if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
      return -61;
    }

    FS.llseek(stream, offset, whence);
    (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)] = tempI64[0],HEAP32[(((newOffset)+(4))>>2)] = tempI64[1]);
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
    return 0;
  } catch (e) {
  if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
}
}


function _fd_write(fd, iov, iovcnt, pnum) {
    debugger;
    HEAP32[((pnum)>>2)] = 0;
    return 0;
    try {
  
    // ;
    // var stream = SYSCALLS.getStreamFromFD(fd);
    // var num = SYSCALLS.doWritev(stream, iov, iovcnt);
    // HEAP32[((pnum)>>2)] = num;
    // return 0;
    } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
        return e.errno;
    }
}

function _gai_strerror(val) {
    var buflen = 256;

    // On first call to gai_strerror we initialise the buffer and populate the error messages.
    if (!_gai_strerror.buffer) {
        _gai_strerror.buffer = _malloc(buflen);

        GAI_ERRNO_MESSAGES['0'] = 'Success';
        GAI_ERRNO_MESSAGES['' + -1] = 'Invalid value for \'ai_flags\' field';
        GAI_ERRNO_MESSAGES['' + -2] = 'NAME or SERVICE is unknown';
        GAI_ERRNO_MESSAGES['' + -3] = 'Temporary failure in name resolution';
        GAI_ERRNO_MESSAGES['' + -4] = 'Non-recoverable failure in name res';
        GAI_ERRNO_MESSAGES['' + -6] = '\'ai_family\' not supported';
        GAI_ERRNO_MESSAGES['' + -7] = '\'ai_socktype\' not supported';
        GAI_ERRNO_MESSAGES['' + -8] = 'SERVICE not supported for \'ai_socktype\'';
        GAI_ERRNO_MESSAGES['' + -10] = 'Memory allocation failure';
        GAI_ERRNO_MESSAGES['' + -11] = 'System error returned in \'errno\'';
        GAI_ERRNO_MESSAGES['' + -12] = 'Argument buffer overflow';
    }

    var msg = 'Unknown error';

    if (val in GAI_ERRNO_MESSAGES) {
      if (GAI_ERRNO_MESSAGES[val].length > buflen - 1) {
        msg = 'Message too long'; // EMSGSIZE message. This should never occur given the GAI_ERRNO_MESSAGES above.
      } else {
        msg = GAI_ERRNO_MESSAGES[val];
      }
    }

    writeAsciiToMemory(msg, _gai_strerror.buffer);
    return _gai_strerror.buffer;
  }

  function _getaddrinfo(node, service, hint, out) {
    // Note getaddrinfo currently only returns a single addrinfo with ai_next defaulting to NULL. When NULL
    // hints are specified or ai_family set to AF_UNSPEC or ai_socktype or ai_protocol set to 0 then we
    // really should provide a linked list of suitable addrinfo values.
    var addrs = [];
    var canon = null;
    var addr = 0;
    var port = 0;
    var flags = 0;
    var family = 0;
    var type = 0;
    var proto = 0;
    var ai, last;

    function allocaddrinfo(family, type, proto, canon, addr, port) {
      var sa, salen, ai;
      var errno;

      salen = family === 10 ?
        28 :
        16;
      addr = family === 10 ?
        inetNtop6(addr) :
        inetNtop4(addr);
      sa = _malloc(salen);
      errno = writeSockaddr(sa, family, addr, port);
      assert(!errno);

      ai = _malloc(32);
      HEAP32[(((ai)+(4))>>2)] = family;
      HEAP32[(((ai)+(8))>>2)] = type;
      HEAP32[(((ai)+(12))>>2)] = proto;
      HEAP32[(((ai)+(24))>>2)] = canon;
      HEAP32[(((ai)+(20))>>2)] = sa;
      if (family === 10) {
        HEAP32[(((ai)+(16))>>2)] = 28;
      } else {
        HEAP32[(((ai)+(16))>>2)] = 16;
      }
      HEAP32[(((ai)+(28))>>2)] = 0;

      return ai;
    }

    if (hint) {
      flags = HEAP32[((hint)>>2)];
      family = HEAP32[(((hint)+(4))>>2)];
      type = HEAP32[(((hint)+(8))>>2)];
      proto = HEAP32[(((hint)+(12))>>2)];
    }
    if (type && !proto) {
      proto = type === 2 ? 17 : 6;
    }
    if (!type && proto) {
      type = proto === 17 ? 2 : 1;
    }

    // If type or proto are set to zero in hints we should really be returning multiple addrinfo values, but for
    // now default to a TCP STREAM socket so we can at least return a sensible addrinfo given NULL hints.
    if (proto === 0) {
      proto = 6;
    }
    if (type === 0) {
      type = 1;
    }

    if (!node && !service) {
      return -2;
    }
    if (flags & ~(1|2|4|
        1024|8|16|32)) {
      return -1;
    }
    if (hint !== 0 && (HEAP32[((hint)>>2)] & 2) && !node) {
      return -1;
    }
    if (flags & 32) {
      // TODO
      return -2;
    }
    if (type !== 0 && type !== 1 && type !== 2) {
      return -7;
    }
    if (family !== 0 && family !== 2 && family !== 10) {
      return -6;
    }

    if (service) {
      service = UTF8ToString(service);
      port = parseInt(service, 10);

      if (isNaN(port)) {
        if (flags & 1024) {
          return -2;
        }
        // TODO support resolving well-known service names from:
        // http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.txt
        return -8;
      }
    }

    if (!node) {
      if (family === 0) {
        family = 2;
      }
      if ((flags & 1) === 0) {
        if (family === 2) {
          addr = _htonl(2130706433);
        } else {
          addr = [0, 0, 0, 1];
        }
      }
      ai = allocaddrinfo(family, type, proto, null, addr, port);
      HEAP32[((out)>>2)] = ai;
      return 0;
    }

    //
    // try as a numeric address
    //
    node = UTF8ToString(node);
    addr = inetPton4(node);
    if (addr !== null) {
      // incoming node is a valid ipv4 address
      if (family === 0 || family === 2) {
        family = 2;
      }
      else if (family === 10 && (flags & 8)) {
        addr = [0, 0, _htonl(0xffff), addr];
        family = 10;
      } else {
        return -2;
      }
    } else {
      addr = inetPton6(node);
      if (addr !== null) {
        // incoming node is a valid ipv6 address
        if (family === 0 || family === 10) {
          family = 10;
        } else {
          return -2;
        }
      }
    }
    if (addr != null) {
      ai = allocaddrinfo(family, type, proto, node, addr, port);
      HEAP32[((out)>>2)] = ai;
      return 0;
    }
    if (flags & 4) {
      return -2;
    }

    //
    // try as a hostname
    //
    // resolve the hostname to a temporary fake address
    node = DNS.lookup_name(node);
    addr = inetPton4(node);
    if (family === 0) {
      family = 2;
    } else if (family === 10) {
      addr = [0, 0, _htonl(0xffff), addr];
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    HEAP32[((out)>>2)] = ai;
    return 0;
  }
            
  function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
    var info = readSockaddr(sa, salen);
    if (info.errno) {
      return -6;
    }
    var port = info.port;
    var addr = info.addr;

    var overflowed = false;

    if (node && nodelen) {
      var lookup;
      if ((flags & 1) || !(lookup = DNS.lookup_addr(addr))) {
        if (flags & 8) {
          return -2;
        }
      } else {
        addr = lookup;
      }
      var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);

      if (numBytesWrittenExclNull+1 >= nodelen) {
        overflowed = true;
      }
    }

    if (serv && servlen) {
      port = '' + port;
      var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);

      if (numBytesWrittenExclNull+1 >= servlen) {
        overflowed = true;
      }
    }

    if (overflowed) {
      // Note: even when we overflow, getnameinfo() is specced to write out the truncated results.
      return -12;
    }

    return 0;
  }

  function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[((ptr)>>2)] = (now/1000)|0; // seconds
    HEAP32[(((ptr)+(4))>>2)] = ((now % 1000)*1000)|0; // microseconds
    return 0;
  }


  function _mktime(tmPtr) {
    _tzset();
    var date = new Date(HEAP32[(((tmPtr)+(20))>>2)] + 1900,
                        HEAP32[(((tmPtr)+(16))>>2)],
                        HEAP32[(((tmPtr)+(12))>>2)],
                        HEAP32[(((tmPtr)+(8))>>2)],
                        HEAP32[(((tmPtr)+(4))>>2)],
                        HEAP32[((tmPtr)>>2)],
                        0);

    // There's an ambiguous hour when the time goes back; the tm_isdst field is
    // used to disambiguate it.  Date() basically guesses, so we fix it up if it
    // guessed wrong, or fill in tm_isdst with the guess if it's -1.
    var dst = HEAP32[(((tmPtr)+(32))>>2)];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset); // DST is in December in South
    if (dst < 0) {
      // Attention: some regions don't have DST at all.
      HEAP32[(((tmPtr)+(32))>>2)] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
    } else if ((dst > 0) != (dstOffset == guessedOffset)) {
      var nonDstOffset = Math.max(winterOffset, summerOffset);
      var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
      // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
      date.setTime(date.getTime() + (trueOffset - guessedOffset)*60000);
    }

    HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();
    var yday = ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))|0;
    HEAP32[(((tmPtr)+(28))>>2)] = yday;
    // To match expected behavior, update fields from date
    HEAP32[((tmPtr)>>2)] = date.getSeconds();
    HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
    HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
    HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
    HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();

    return (date.getTime() / 1000)|0;
  }

  function _setTempRet0(val) {
    setTempRet0(val);
  }

  function _strftime(s, maxsize, format, tm) {
    // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
    // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html

    var tm_zone = HEAP32[(((tm)+(40))>>2)];

    var date = {
      tm_sec: HEAP32[((tm)>>2)],
      tm_min: HEAP32[(((tm)+(4))>>2)],
      tm_hour: HEAP32[(((tm)+(8))>>2)],
      tm_mday: HEAP32[(((tm)+(12))>>2)],
      tm_mon: HEAP32[(((tm)+(16))>>2)],
      tm_year: HEAP32[(((tm)+(20))>>2)],
      tm_wday: HEAP32[(((tm)+(24))>>2)],
      tm_yday: HEAP32[(((tm)+(28))>>2)],
      tm_isdst: HEAP32[(((tm)+(32))>>2)],
      tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
      tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
    };

    var pattern = UTF8ToString(format);

    // expand format
    var EXPANSION_RULES_1 = {
      '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
      '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
      '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
      '%h': '%b',                       // Equivalent to %b
      '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
      '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
      '%T': '%H:%M:%S',                 // Replaced by the time
      '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
      '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
      // Modified Conversion Specifiers
      '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
      '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
      '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
      '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
      '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
      '%EY': '%Y',                      // Replaced by the full alternative year representation.
      '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
      '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
      '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
      '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
      '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
      '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
      '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
      '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
      '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
      '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
      '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
      '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
      '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
    };
    for (var rule in EXPANSION_RULES_1) {
      pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
    }

    var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function leadingSomething(value, digits, character) {
      var str = typeof value === 'number' ? value.toString() : (value || '');
      while (str.length < digits) {
        str = character[0]+str;
      }
      return str;
    }

    function leadingNulls(value, digits) {
      return leadingSomething(value, digits, '0');
    }

    function compareByDay(date1, date2) {
      function sgn(value) {
        return value < 0 ? -1 : (value > 0 ? 1 : 0);
      }

      var compare;
      if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
        if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
          compare = sgn(date1.getDate()-date2.getDate());
        }
      }
      return compare;
    }

    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
          case 0: // Sunday
            return new Date(janFourth.getFullYear()-1, 11, 29);
          case 1: // Monday
            return janFourth;
          case 2: // Tuesday
            return new Date(janFourth.getFullYear(), 0, 3);
          case 3: // Wednesday
            return new Date(janFourth.getFullYear(), 0, 2);
          case 4: // Thursday
            return new Date(janFourth.getFullYear(), 0, 1);
          case 5: // Friday
            return new Date(janFourth.getFullYear()-1, 11, 31);
          case 6: // Saturday
            return new Date(janFourth.getFullYear()-1, 11, 30);
        }
    }

    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);

        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);

        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);

        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
          // this date is after the start of the first week of this year
          if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
            return thisDate.getFullYear()+1;
          } else {
            return thisDate.getFullYear();
          }
        } else {
          return thisDate.getFullYear()-1;
        }
    }

    var EXPANSION_RULES_2 = {
      '%a': function(date) {
        return WEEKDAYS[date.tm_wday].substring(0,3);
      },
      '%A': function(date) {
        return WEEKDAYS[date.tm_wday];
      },
      '%b': function(date) {
        return MONTHS[date.tm_mon].substring(0,3);
      },
      '%B': function(date) {
        return MONTHS[date.tm_mon];
      },
      '%C': function(date) {
        var year = date.tm_year+1900;
        return leadingNulls((year/100)|0,2);
      },
      '%d': function(date) {
        return leadingNulls(date.tm_mday, 2);
      },
      '%e': function(date) {
        return leadingSomething(date.tm_mday, 2, ' ');
      },
      '%g': function(date) {
        // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
        // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
        // January 4th, which is also the week that includes the first Thursday of the year, and
        // is also the first week that contains at least four days in the year.
        // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
        // the last week of the preceding year; thus, for Saturday 2nd January 1999,
        // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
        // or 31st is a Monday, it and any following days are part of week 1 of the following year.
        // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.

        return getWeekBasedYear(date).toString().substring(2);
      },
      '%G': function(date) {
        return getWeekBasedYear(date);
      },
      '%H': function(date) {
        return leadingNulls(date.tm_hour, 2);
      },
      '%I': function(date) {
        var twelveHour = date.tm_hour;
        if (twelveHour == 0) twelveHour = 12;
        else if (twelveHour > 12) twelveHour -= 12;
        return leadingNulls(twelveHour, 2);
      },
      '%j': function(date) {
        // Day of the year (001-366)
        return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
      },
      '%m': function(date) {
        return leadingNulls(date.tm_mon+1, 2);
      },
      '%M': function(date) {
        return leadingNulls(date.tm_min, 2);
      },
      '%n': function() {
        return '\n';
      },
      '%p': function(date) {
        if (date.tm_hour >= 0 && date.tm_hour < 12) {
          return 'AM';
        } else {
          return 'PM';
        }
      },
      '%S': function(date) {
        return leadingNulls(date.tm_sec, 2);
      },
      '%t': function() {
        return '\t';
      },
      '%u': function(date) {
        return date.tm_wday || 7;
      },
      '%U': function(date) {
        // Replaced by the week number of the year as a decimal number [00,53].
        // The first Sunday of January is the first day of week 1;
        // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
        var janFirst = new Date(date.tm_year+1900, 0, 1);
        var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
        var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);

        // is target date after the first Sunday?
        if (compareByDay(firstSunday, endDate) < 0) {
          // calculate difference in days between first Sunday and endDate
          var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
          var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
          var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
          return leadingNulls(Math.ceil(days/7), 2);
        }

        return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
      },
      '%V': function(date) {
        // Replaced by the week number of the year (Monday as the first day of the week)
        // as a decimal number [01,53]. If the week containing 1 January has four
        // or more days in the new year, then it is considered week 1.
        // Otherwise, it is the last week of the previous year, and the next week is week 1.
        // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
        var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
        var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);

        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);

        var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);

        if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
          // if given date is before this years first week, then it belongs to the 53rd week of last year
          return '53';
        }

        if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
          // if given date is after next years first week, then it belongs to the 01th week of next year
          return '01';
        }

        // given date is in between CW 01..53 of this calendar year
        var daysDifference;
        if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
          // first CW of this year starts last year
          daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
        } else {
          // first CW of this year starts this year
          daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
        }
        return leadingNulls(Math.ceil(daysDifference/7), 2);
      },
      '%w': function(date) {
        return date.tm_wday;
      },
      '%W': function(date) {
        // Replaced by the week number of the year as a decimal number [00,53].
        // The first Monday of January is the first day of week 1;
        // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
        var janFirst = new Date(date.tm_year, 0, 1);
        var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
        var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);

        // is target date after the first Monday?
        if (compareByDay(firstMonday, endDate) < 0) {
          var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
          var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
          var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
          return leadingNulls(Math.ceil(days/7), 2);
        }
        return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
      },
      '%y': function(date) {
        // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
        return (date.tm_year+1900).toString().substring(2);
      },
      '%Y': function(date) {
        // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
        return date.tm_year+1900;
      },
      '%z': function(date) {
        // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
        // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
        var off = date.tm_gmtoff;
        var ahead = off >= 0;
        off = Math.abs(off) / 60;
        // convert from minutes into hhmm format (which means 60 minutes = 100 units)
        off = (off / 60)*100 + (off % 60);
        return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
      },
      '%Z': function(date) {
        return date.tm_zone;
      },
      '%%': function() {
        return '%';
      }
    };
    for (var rule in EXPANSION_RULES_2) {
      if (pattern.includes(rule)) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
      }
    }

    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
      return 0;
    }

    writeArrayToMemory(bytes, s);
    return bytes.length-1;
  }

  function _time(ptr) {
    ;
    var ret = (Date.now()/1000)|0;
    if (ptr) {
      HEAP32[((ptr)>>2)] = ret;
    }
    return ret;
  }


  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
      //assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
      HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
    }
    // Null-terminate the pointer to the HEAP.
    if (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
  }

  function setValue(ptr, value, type, noSafe) {
    type = type || 'i8';
    if (type.charAt(type.length-1) === '*') type = 'i32';
      switch (type) {
        case 'i1': HEAP8[((ptr)>>0)] = value; break;
        case 'i8': HEAP8[((ptr)>>0)] = value; break;
        case 'i16': HEAP16[((ptr)>>1)] = value; break;
        case 'i32': HEAP32[((ptr)>>2)] = value; break;
        case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); break;
        case 'float': HEAPF32[((ptr)>>2)] = value; break;
        case 'double': HEAPF64[((ptr)>>3)] = value; break;
        default: abort('invalid type for setValue: ' + type);
      }
  }