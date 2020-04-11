(define-syntax-rule (define-accessor name n)
  (define (name obj)
    (struct-ref obj n)))

(define-accessor class-name (+ vtable-offset-user 0))
(define-accessor class-methods (+ vtable-offset-user 1))
(define-accessor object-fields 0)

(define (print-class x port)
  (format port "<~a>" (class-name x)))

(define (print-instance x port)
  (format port "<~a instance>" (class-name (struct-vtable x))))

(define <class>
  (make-vtable
    (string-append standard-vtable-fields "pwpw")
    print-class))

(define (make-class name funcs)
  (let* ((class (make-struct/no-tail <class> 
                  (make-struct-layout "pw") 
                  print-instance 
                  name
                  (make-hash-table)))
         (methods (class-methods class)))
    (for-each (lambda (func)
                (hashq-set! methods 
                            (car func) 
                            (eval (cadr func) (interaction-environment))))
              funcs)
    class))

(define (class? x)
  (and (struct? x)
       (eq? (struct-vtable x) <class>)))

(define-syntax-rule (define-class name methods ...)
  (define name (make-class 'name '(methods ...))))

(define-syntax-rule (method-ref object name)
  (hashq-ref (class-methods (struct-vtable object)) 'name))

(define-syntax-rule (method-call object name)
  ((method-ref object name) object))

(define-syntax-rule (field-ref object name)
  (hashq-ref (object-fields object) 'name))

(define-syntax-rule (field-set! object name value)
  (hashq-set! (object-fields object) 'name value))

(define-syntax-rule (make-instance name class )
  (define name
    (let* ((properties (make-hash-table))
         (ret (make-struct/no-tail class properties)))

      (if (method-ref ret init) (method-call ret init))
      ret)))

(define-class Cat
  (init (lambda (self)
          (field-set! self name "Cat")))
  (speak (lambda (self)
           "meow")))
(make-instance tiger Cat)

(method-call tiger speak)
(field-ref tiger name)
(field-set! tiger name "Tiger")
(field-ref tiger name)

