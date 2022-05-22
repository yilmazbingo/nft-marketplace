it is to bundle the form information. it is a replication of what form does. it is array of arrays.

- if you upload file, it will `Blob` object. Blob is binary large object

```js
//If you want to send the following data to the web server:
name = John
age = 12
//using application/x-www-form-urlencoded would be like this:
name=John&age=12
// As you can see, the server knows that parameters are separated by an ampersand &. If & is required for a parameter value then it must be encoded.
```

- So how does the server know where a parameter value starts and ends when it receives an HTTP request using multipart/form-data?

      Using the boundary, similar to &.

  The boundary is automatically added to a content-type of a request header.
