<?php
// A payment rule was broken (cash too low, GCash reference reused, order already paid, ...)
class PayException extends ApiException {}
