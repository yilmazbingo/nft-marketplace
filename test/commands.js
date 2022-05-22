const instance = await NftMarket.deployed();
// global = this
// since we minted token with accounts[0] we need to take this account from ganache and add it to metamask
('instance.mintToken("https://gateway.pinata.cloud/ipfs/Qmb4aom5xNRE5CBRHZsxCsYSdcmX8zfHXgM7ovZxLp3CqL","500000000000000000",{value: "25000000000000000", from: accounts[0]})');
('instance.mintToken("https://gateway.pinata.cloud/ipfs/QmeVq2CNW9XPrrQpbzxV1WXSSD6qC6c9o5RECR5bXdVFLB","300000000000000000",{value: "25000000000000000",from: accounts[0]})');
