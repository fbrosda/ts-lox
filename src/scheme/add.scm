(use-modules (srfi srfi-1))
(define *add*
  (lambda (. args)
    (cond ((every number? args)
           (apply + args))
          ((any string? args)
           (apply string-append 
                  (map (lambda (x) (format #f "~a" x))
                       args)))
          (else (throw 'invalidArgs 
                       "Operands must be either strings or numbers.")))))
