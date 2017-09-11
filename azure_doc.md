# Azure unofficial doc
This document should contain clarification of official documentation and behavior of Azure in practice.

## Office 365 Management Activity API reference
The documentation about [Office 365 API](https://msdn.microsoft.com/en-us/office-365/office-365-management-activity-api-reference) 
contains several either mistakes or behavior we could not observer. 

### Notification failure and retry
The notification shall retry delivery in case of failure. If it encounter excessive failures it shall increase the time between retries. 
That may potentially lead to disabling the webhook. However we could not observer any message redelivery neither disabling the webhook. 
The webhook was invoked 8 times and contained 19 messages (contents) in total. 

### Endpoint with startTime and endTime
Either both must be present or omitted and the difference between each of them can not be larger than 24h. It is incorrect and it doesn't 
work with both parameters. It worked with `startTime` only and the difference between `startTime` and now can be more than 24h.


## Azure Function

### Return status
There should be at least three ways how to specify return status (code) according this 
(doc)[https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node]. However the only way which works is:
```
context.res.headers = {};
context.res.status = 500;
```

### Status in Invocation log
The status (either red cross or green tick) most likely indicates whether the function crashes or finishes with `context.done()`. It doesn't 
reflect return status code.


