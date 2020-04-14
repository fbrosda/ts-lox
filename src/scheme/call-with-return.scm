(define (call-with-return func args)
  (let/ec return
    (apply func (cons return args))))
