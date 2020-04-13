(define (call-with-return func args)
  (call/cc
    (lambda (return)
      (apply func (cons return args)))))
