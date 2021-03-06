(define-syntax-rule (define-accessor name n)
  (define (name obj)
    (struct-ref obj n)))

(define-accessor class-name (+ vtable-offset-user 0))
(define-accessor class-parent (+ vtable-offset-user 1))
(define-accessor class-methods (+ vtable-offset-user 2))
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
    (string-append standard-vtable-fields "pwpwpw")
    print-class))

(define (class? x)
  (and (struct? x)
       (eq? (struct-vtable x) <class>)))

(define (print-instance x port)
  (format port "<~a instance>" (class-name (struct-vtable x))))

(define (create-class name superclass)
  (make-struct/no-tail <class>
                       (make-struct-layout "pw")
                       print-instance
                       name
                       superclass
                       (make-hash-table)))

(define (make-class name superclass funcs)
  (let* ((class (create-class name superclass))
         (methods (class-methods class)))
    (for-each (lambda (definition)
                (define-method methods definition))
              funcs)
    class))

(define-syntax create-method
  (lambda (x)
    (syntax-case x ()
                 ((_ superclass (args ...) body ...)
                  (with-syntax ((this (datum->syntax x 'this))
                                (return (datum->syntax x 'return))
                                (super (datum->syntax x 'super)))
                               #'(lambda (this return args ...)
                                   (let ((super superclass))
                                     body ...)))))))

(define-syntax define-class
  (syntax-rules (<)
    ((_ name (method-name method-args method-body ...) ...)
     (define-class name < #f (method-name method-args method-body ...) ...))
    ((_ name < superclass (method-name method-args method-body ...) ...)
     (define name
       (make-class 'name 
                   superclass
                   '((method-name 
                       (create-method superclass
                                      method-args
                                      method-body ...))
                     ...))))))

(define (find-method object name)
  (let* ((c (if (class? object) object (struct-vtable object)))
         (m (hashq-ref (class-methods c) name))
         (p (class-parent c)))
    (cond 
      (m m)
      (p (find-method p name))
      (else #f))))

(define (method-ref object name)
  (let ((m (find-method object name)))
    (if m 
        (lambda args (apply m (cons object args)))
        #f)))

(define (method-call object name . args)
  (let ((m (method-ref object name)))
    (if m
        (call-with-return m args)
        (throw 'unknownMethod 
               (*add* "Cannot find method " name " for object " object)))))

(define (field-ref object name)
  (let ((field (hashq-ref (object-fields object) name)))
    (or field (method-ref object name))))

(define (field-set! object name value)
  (hashq-set! (object-fields object) name value)
  (values))

(define (make-instance class . args)
  (let* ((properties (make-hash-table))
         (ret (make-struct/no-tail class properties))
         (init (method-ref ret 'init)))
    (when init
      (call-with-return init args))
    ret))
