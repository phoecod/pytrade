class CustomError(Exception):
    def __init__(self, message, error_code, error_traceback):
        super().__init__(message)
        self.error_code = error_code
        self.error_traceback = error_traceback