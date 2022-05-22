const NftMarket = artifacts.require("NftMarket");
const { ethers } = require("ethers");

contract("Nft Market", (accounts) => {
  let _contract = null;
  let _nftPrice = ethers.utils.parseEther("0.1").toString();
  let _listingPrice = ethers.utils.parseEther("0.025").toString();

  before(async () => {
    _contract = await NftMarket.deployed();
  });

  describe("Mint token function", () => {
    const tokenURI = "sample";
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice,
      });
    });
    it("owner of first token should be accounts[0]", async () => {
      const owner = await _contract.ownerOf(1);
      //   assert(owner == accounts[0], "address is not true");
      assert.equal(owner, accounts[0], "address is not correct");
    });

    it("first token should point to the correct token URI", async () => {
      const actualTokenURI = await _contract.tokenURI(1);
      //   assert(owner == accounts[0], "address is not true");
      assert.equal(actualTokenURI, tokenURI, "token uri is not correctly set");
    });

    it("should not possible to create a nft with used tokenURI", async () => {
      try {
        await _contract.mintToken(tokenURI, _nftPrice, {
          from: accounts[0],
        });
      } catch (error) {
        console.log("error is caught");
        assert(error, "NFT was minted with previously used tokenURi");
      }
      // assert.equal(actualTokenURI, tokenURI, "token uri is not correctly set");
    });
    it("should have one listed item", async () => {
      const listedItemCount = await _contract.listedItemsCount();
      console.log("checking the type of Listeditemcount", listedItemCount);
      assert.equal(
        listedItemCount.toNumber(),
        1,
        "Listem items count is not 1"
      );
    });

    it("should have created Nft item", async () => {
      const nftItem = await _contract.getNftItem(1);
      // frist 4 rows raw data without key and next 4 rows data with keys
      console.log("checking the type of nft", nftItem);
      assert.equal(nftItem.tokenId, 1, "Token Id is  not 1");
      assert.equal(
        nftItem.price,
        _nftPrice,
        `Token price is  not ${_nftPrice}`
      );
      assert.equal(
        nftItem.creator,
        accounts[0],
        `creator is  not ${accounts[0]}`
      );
      assert.equal(nftItem.isListed, true, "token is not listed");
    });
  });

  describe("Buy Nft", () => {
    before(async () => {
      await _contract.buyNft(1, {
        from: accounts[1],
        value: _nftPrice,
      });
    });
    // before does not run unless u have it
    it("should unlist the item", async () => {
      const listedItem = await _contract.getNftItem(1);
      assert.equal(listedItem.isListed, false, "Item is still listed");
    });
    it("should decrease listed items count", async () => {
      const listedItemsCount = await _contract.listedItemsCount();
      assert.equal(
        listedItemsCount.toNumber(),
        0,
        "Count has not been decreased"
      );
    });
    it("should change the owner", async () => {
      const currentOwner = await _contract.ownerOf(1);
      assert.equal(currentOwner, accounts[1], "Owner is not correct");
    });
  });
  describe("Token transfers", () => {
    before(async () => {
      const tokenURI = "secondsample";
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice,
      });
    });
    it("should have 2 nfts created", async () => {
      const totalSupply = await _contract.totalSupply();
      assert.equal(totalSupply.toNumber(), 2, "total supplly is not correct");
    });
    it("should be able to retireve nft by index", async () => {
      const nftId1 = await _contract.tokenByIndex(0);
      const nftId2 = await _contract.tokenByIndex(1);

      assert.equal(nftId1.toNumber(), 1, "id of nft is not 1");
      assert.equal(nftId2.toNumber(), 2, "id of nft is not 2");
    });
    // we created 2 so far but we bougth 1
    it("should have one listed Nft", async () => {
      const allNfts = await _contract.getAllNftsOnSale();
      assert.equal(allNfts[0].tokenId, 2, "Nft has wrong id");
    });
    it("account[1] should have one nft", async () => {
      // if i dont pass {from:accounts[1]}, default was accounts[0]
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[1] });
      assert.equal(ownedNfts[0].tokenId, 1, "nft has wrong id");
    });
    it("account[1] should have one nft", async () => {
      // if i dont pass {from:accounts[1]}, default was accounts[0]
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[0] });
      assert.equal(ownedNfts[0].tokenId, 2, "nft has wrong id");
    });
  });

  describe("Token transfer to new owner", () => {
    before(async () => {
      // accounts[0] is holding tokenId 2 and trasferring to accounts[2]
      await _contract.transferFrom(accounts[0], accounts[1], 2);
    });
    it("Accouns[0] should own 0 tokens", async () => {
      const ownedNfts = await _contract.getOwnedNfts({
        from: accounts[0],
      });
      assert.equal(ownedNfts.length, 0, "Invalid length of tokens");
    });
    it("Accouns[1] should own 2 tokens", async () => {
      const ownedNfts = await _contract.getOwnedNfts({
        from: accounts[1],
      });
      assert.equal(ownedNfts.length, 2, "Invalid length of tokens");
    });
  });
  // ******************** BURN TOKEN OPTIONAL ************
  // describe("Burn token", () => {
  //   const tokenURI = "sample2";
  //   before(async () => {
  //     await _contract.mintToken(tokenURI, _nftPrice, {
  //       from: accounts[2],
  //       value: _listingPrice,
  //     });
  //   });

  //   it("Accouns[2] should own 1 token", async () => {
  //     const ownedNfts = await _contract.getOwnedNfts({
  //       from: accounts[2],
  //     });
  //     console.log("before burning nft ", ownedNfts);
  //     // Becasue so far we have minted 3 so id is 3
  //     assert.equal(ownedNfts[0].tokenId, 3, "Nft has wrong Id");
  //   });
  //   it("account[2] should have 0 nft after burn", async () => {
  //     await _contract.burnToken(3, { from: accounts[2] });
  //     const ownedNfts = await _contract.getOwnedNfts({ from: accounts[2] });
  //     console.log("after burning nft", ownedNfts);
  //     assert.equal(ownedNfts.length, 0, "Invalid length of tokens");
  //   });
  // });

  describe("List an Nft", () => {
    before(async () => {
      // find which nft is unlisted. anyone that who has been bought. we bought the tokenId=1 above
      // and owner of TokenId1=account[1]
      await _contract.placeNftOnSale(1, _nftPrice, {
        from: accounts[1],
        value: _listingPrice,
      });
    });
    it("should have two listed Items", async () => {
      const listedNfts = await _contract.getAllNftsOnSale();
      assert.equal(listedNfts.length, 2, "Invalid length of nfts");
    });
  });
});
