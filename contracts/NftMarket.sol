// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

// In truffle, accounts[0] by default deploys the contract so it is the owner
// tokenURIs are also stored in "storage". The base implementation in ERC721.sol reads the baseURI in memory and concatenates the resulting String on-the-fly, without storing them as a state var.
contract NftMarket is ERC721URIStorage,Ownable {
  // using A for B, it means that we attach every function from library A to type B.
  // Libraries are an efficient way to reduce gas fees, because they are deployed only once at a specific address with its code being reused by various contracts.
  using Counters for Counters.Counter;
  // initially 0
  Counters.Counter private _listedItems;
  Counters.Counter private _tokenIds;
  // all token id's in array
  uint256[] private _allNfts;
  // mappings are used for fast look up
  mapping(string=>bool) private _usedTokenURIs;
  mapping(uint => NftItem) private _idToNftItem;
  // tokenId=>index
  mapping(uint=>uint) private _idToNftIndex;
  //{address:{1:tokenId-1,2:tokenId-2}}
  mapping(address=>mapping(uint=>uint)) private _ownedTokens;
  // Tokenid --> index
  mapping(uint=> uint) private _idToOwnedIndex;
  uint public listingPrice=0.025 ether;

  struct NftItem{
    uint tokenId;
    uint price;
    // creator and owner are not same. creator someone who minted. creator does not change
    address creator;
    bool isListed;
  }
  // we dont have to put ";" after {} but after ()
  event NftItemCreated(
    uint tokenId,
    uint price,
    address creator,
    bool isListed
  );
  constructor() ERC721("CreaturesNFT", "CNFT") {}

  function burnToken(uint tokenId) public {
    // _burn is from URIStorage
    _burn(tokenId);
  }

  function mintToken(string memory tokenURI,uint price) public payable returns (uint){
    require(!tokenURIExists(tokenURI),"Token URI already exists");
    require(msg.value==listingPrice,"Price must be equal to listing fee");
    _tokenIds.increment();
    _listedItems.increment();
    uint newTokenId=_tokenIds.current();
    // this is a wrapper for _mint
    _safeMint(msg.sender,newTokenId);
    _setTokenURI(newTokenId, tokenURI);
    _createNftItem(newTokenId,price);
    _usedTokenURIs[tokenURI]=true;
    return newTokenId;
  }
  function setListingPrice(uint newPrice) external onlyOwner{
    require(newPrice>0,"Price must be at least 1 wei");
    listingPrice=newPrice;
  }

  // why do we have to set memory for struct data
  function getNftItem(uint tokenId) public view returns(NftItem memory){
    return _idToNftItem[tokenId];
  }

  function listedItemsCount() public view returns(uint){
    return _listedItems.current();
  }

  function tokenURIExists(string memory tokenURI) public view returns(bool){
    return _usedTokenURIs[tokenURI]==true;
  }

  function totalSupply() public view returns (uint){
    return _allNfts.length;
  }

  function tokenByIndex(uint index)public view returns (uint){
    require(index<totalSupply(),"Index out of bounds");
    return _allNfts[index];
  }

  function tokenOfOwnerByIndex(address owner,uint index) public view returns(uint){
    require(index<ERC721.balanceOf(owner), "Index out of bounds");
    return _ownedTokens[owner][index];
  }
  function getAllNftsOnSale()public view returns (NftItem[] memory){
    uint allItemsCount=totalSupply();
    uint currentIndex=0;
    NftItem[] memory items=new NftItem[](_listedItems.current());
    for (uint i=0;i<allItemsCount;i++){
      uint tokenId=tokenByIndex(i);
      NftItem storage item=_idToNftItem[tokenId];
      if(item.isListed==true){
        items[currentIndex]=item;
        currentIndex+=1;
      }
    }
    return items;
  }

  function getOwnedNfts() public view returns(NftItem[] memory){
    uint ownedItemsCount=ERC721.balanceOf(msg.sender);
    NftItem[] memory items= new NftItem[](ownedItemsCount);
    for (uint i=0; i<ownedItemsCount; i++){
      uint tokenId=tokenOfOwnerByIndex(msg.sender, i);
      NftItem storage item=_idToNftItem[tokenId];
      items[i]=item;
    }
    return items;
  }

  

  function buyNft(uint tokenId) public payable{
    uint price=_idToNftItem[tokenId].price;
    // this is set in erc721 contract
    // Since contracts are inheriting, I want to make sure I use this method in ERC721
    address owner=ERC721.ownerOf(tokenId);
    require(msg.sender!=owner,"You already own this nft");
    require(msg.value==price,"Please submit the asking price");
    _idToNftItem[tokenId].isListed=false;
    _listedItems.decrement();
    _transfer(owner,msg.sender,tokenId);
    payable(owner).transfer(msg.value);
  }

  function _createNftItem(uint tokenId,uint price) private{
    require(price > 0, "Price must be at least 1 wei");
    _idToNftItem[tokenId]=NftItem(
      tokenId,
      price,
      msg.sender,
      true
    );
    emit NftItemCreated(tokenId,price, msg.sender,true);
  }
  // this gets executed in erc721in _mint,_burn and _transfer
  function _beforeTokenTransfer(address from, address to,uint tokenId)internal virtual override{
    // in case this is provided in super contract, the contract that you are extending from call this
    super._beforeTokenTransfer(from,to,tokenId);
    // that means we are minting the token
    // Becasue inside ERC721._mint we call _beforeTokenTransfer(address(0),to,tokenId)
    if(from==address(0)){
      _addTokenToAllTokensEnumeration(tokenId);
    } else if(from!=to){
      // we first remove the owner and add ownership to another owner
      _removeTokenFromOwnerEnumeration(from, tokenId);
    }
    // we are burning token
    if(to==address(0)){
      _removeTokenFromAlTokenEnumeration(tokenId);
    } else if (to!=from){
      // this also satisfied when we mint the token. 
      _addTokenToOwnerEnumeration(to, tokenId);
    }

  }
  function _addTokenToAllTokensEnumeration(uint tokenId) private{
    _idToNftIndex[tokenId]=_allNfts.length;
    _allNfts.push(tokenId);
  }

  function _addTokenToOwnerEnumeration(address to, uint tokenId) private{
    uint length=ERC721.balanceOf(to);
    _ownedTokens[to][length]=tokenId;
    _idToOwnedIndex[tokenId]=length;
  }

  function _removeTokenFromOwnerEnumeration(address from,uint tokenId) private{
    uint lastTokenIndex=ERC721.balanceOf(from)-1;
    // I want to remove this
    uint tokenIndex=_idToOwnedIndex[tokenId];
    if(tokenIndex!=lastTokenIndex){
      uint lastTokenId=_ownedTokens[from][lastTokenIndex];
      // this is remapping
      _ownedTokens[from][tokenIndex]=lastTokenId;
      _idToOwnedIndex[lastTokenId]=tokenIndex;
    }
    // if we want to delete the last index we would get here directly
    delete _idToOwnedIndex[tokenId];
    delete _ownedTokens[from][lastTokenIndex];
  }
 // destroying token
  function _removeTokenFromAlTokenEnumeration(uint tokenId) private{
    uint lastTokenIndex=_allNfts.length-1;
    uint tokenIndexToRemove=_idToNftIndex[tokenId];
    uint lastTokenId=_allNfts[lastTokenIndex];
    // after this we will have two lastTokenid in the array
    _allNfts[tokenIndexToRemove]=lastTokenId;
    _idToNftIndex[lastTokenId]=tokenIndexToRemove;
    delete _idToNftIndex[tokenId];
    _allNfts.pop();
  }

  function placeNftOnSale(uint tokenId, uint newPrice) public payable{
    // if the owner of the token is the sender of the transaction
    require(ERC721.ownerOf(tokenId)==msg.sender,"You are not the owner of the Nft");
    require(_idToNftItem[tokenId].isListed==false,"Item is already on sale");
    require(msg.value==listingPrice,'Price must be equal to listing price');
    _idToNftItem[tokenId].isListed=true;
    _listedItems.increment();
    _idToNftItem[tokenId].price=newPrice;
  }
}
