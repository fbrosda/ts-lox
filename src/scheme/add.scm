(define *add*
  (lambda (l r)
    (cond ((and (number? l) (number? r))
           (+ l r))
          ((or (string? l) (string? r))
           (string-append
             (format #f "~a" l)
             (format #f "~a" r)))
          (else (throw 'invalidArgs "Operands must be either strings or numbers.")))))
