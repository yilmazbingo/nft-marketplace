- we need to verify the user before submitting the data to pinata. whenever we upload a content to pinata, we have to verify the address

1- server creates a message={contractAddress,randomId

```js
    else if (req.method === "GET") {
        // creating a message is the first step of verification
      try {
        const message = { contractAddress, id: uuidv4() };
        req.session.messageSession = {
          ...message,
        };
        await req.session.save();
        return res.json(message);
      } catch (error) {
        res.status(422).send({ message: "Cannot generate a message" });
      }
```

then we create a session with this message. and this will also store the cookie in the browser

2- user makes GET request and this message is stored on browser

Before we create data on pinata, we want to verify the address of user that is connected to the wallet. For this we need to get the message from server.

3- browser creates a signature. account is currently connected, password can be anything, we use the `uuid`

       ```js
        const signedData = await ethereum?.request({
        method: "personal_sign",
        params: [
          JSON.stringify(messageToSign.data),
          account,
          messageToSign.data.id,
        ],
      });
       ```

4- Verify account or address

- we make a POST request to the same endpoint.

  ```js
  await axios.post("/api/verify", {
    address: account,
    signature: signedData,
    nft: nftMeta,
  });
  ```

- server gets the unsigned message, which is the message that stored in session

- we will compare the unsigned message with the signature, using web3 package
  ? match sig and unsignedMessage will create an `address`. If this address matched with address in the request body.address. if the address is valid, upload the nft.
