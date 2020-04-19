(define* (call-with-return func #:optional (args '()))
  (let/ec return
    (apply func (cons return args))))
