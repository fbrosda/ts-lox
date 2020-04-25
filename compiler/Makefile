CFLAGS ?= -std=c99 -Wall -Wextra -pedantic -g

all: clox

clox: main.o chunk.o memory.o debug.o value.o
	$(CC) $(CFLAGS) -o clox main.o chunk.o memory.o debug.o value.o

main.o: main.c common.h debug.h
	$(CC) $(CFLAGS) -c main.c

chunk.o: chunk.c chunk.h memory.h
	$(CC) $(CFLAGS) -c chunk.c

memory.o: memory.c memory.h common.h
	$(CC) $(CFLAGS) -c memory.c

debug.o: debug.c debug.h chunk.h
	$(CC) $(CFLAGS) -c debug.c

value.o: value.c value.h memory.h
	$(CC) $(CFLAGS) -c value.c

clean:
	-rm *.o

distclean: clean
	-rm clox

.PHONY: clean, distclean
