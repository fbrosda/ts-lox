(define-syntax-rule (define-accessor name n)
  (define (name obj)
    (struct-ref obj n)))

(define-accessor class-name (+ vtable-offset-user 0))
(define-accessor class-methods (+ vtable-offset-user 1))
(define-accessor object-fields 0)

(define-syntax-rule 
  (get-method-name definition)
  (car definition))

(define-syntax-rule 
  (get-method-func definition)
  (eval (cadr definition) (interaction-environment)))

(define (define-method methods definition)
  (let ((method-name (get-method-name definition))
        (method-func (get-method-func definition)))
    (hashq-set! methods method-name method-func)))

(define (print-class x port)
  (format port "<~a>" (class-name x)))

(define <class>
  (make-vtable
    (string-append standard-vtable-fields "pwpw")
    print-class))

(define (class? x)
  (and (struct? x)
       (eq? (struct-vtable x) <class>)))

(define (print-instance x port)
  (format port "<~a instance>" (class-name (struct-vtable x))))

(define (create-class name)
  (make-struct/no-tail <class> 
    (make-struct-layout "pw") print-instance name (make-hash-table)))

(define (make-class name funcs)
  (let* ((class (create-class name))
         (methods (class-methods class)))
    (for-each (lambda (definition)
                (define-method methods definition))
              funcs)
    class))

(define-syntax method
  (lambda (x)
    (syntax-case x ()
      ((_ (args ...) body ...)
       (with-syntax ((self (datum->syntax x 'self)))
         #'(lambda (self args ...)
             body ...))))))

(define-syntax-rule (define-class name methods ...)
  (define name (make-class 'name '(methods ...))))

(define-syntax-rule (define-instance name class )
  (define name
    (let* ((properties (make-hash-table))
         (ret (make-struct/no-tail class properties)))

      (if (method-ref ret init) (method-call ret init))
      ret)))

(define-syntax-rule (method-ref object name)
  (hashq-ref (class-methods (struct-vtable object)) 'name))

(define-syntax-rule (method-call object name)
  ((method-ref object name) object))

(define-syntax-rule (field-ref object name)
  (hashq-ref (object-fields object) 'name))

(define-syntax-rule (field-set! object name value)
  (hashq-set! (object-fields object) 'name value))




(define-class Cat
  (init (method ()
          (field-set! self name "Cat")))
  (speak (method ()
           (string-append (field-ref self name) ": 'meow'"))))
(define-instance tiger Cat)

(method-call tiger speak)
(field-ref tiger name)
(field-set! tiger name "Tiger")
(field-ref tiger name)

