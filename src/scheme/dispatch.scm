(define (*dispatch* ref . args)
  (if (class? ref)
      (apply make-instance (cons ref args))
      (call-with-return ref args)))
