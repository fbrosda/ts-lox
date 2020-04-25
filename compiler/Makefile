CFLAGS ?= -std=c99 -Wall -Wextra -pedantic -g

all: clox

clox: main.o
	$(CC) $(CFLAGS) -o clox main.o

main.o: main.c common.h
	$(CC) $(CFLAGS) -c main.c

clean:
	-rm *.o

distclean: clean
	-rm clox

.PHONY: clean, distclean
