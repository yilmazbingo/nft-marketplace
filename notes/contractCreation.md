https://leftasexercise.com/2021/09/05/a-deep-dive-into-solidity-contract-creation-and-the-init-code/

A transaction will create a contract if the recipient address of the transaction is empty (i.e. technically the zero address). A creation operation can contain a value, which is then credited to the address of the newly created contract (even though in Solidity, this requires a payable constructor). Then, the initialisation bytecode, i.e. the content of the init field of the transaction, is executed, and the returned array of bytes is stored as the bytecode of the newly created contract. Thus there are in fact two different types of bytecode involved during the creation of a smart contract – `the runtime bytecode` which is the code executed when the contract is invoked after its initial creation, and `the init bytecode` which is responsible for preparing the contract and returning the runtime bytecode.

Thus the init bytecode needs to

- make any changes to the state of the contract address needed (maybe initialize some state variables)
- place the runtime bytecode somewhere in memory
- push the length of the runtime bytecode onto the stack
- push the offset of the runtime bytecode (i.e. the address in memory where it starts) onto the stack
- execute the RETURN statement

` A smart contract is created by sending a transaction with an empty "to" field. When this is done, the (EVM) runs the bytecode which is set in the init byte array[1] which is a field that can contain EVM bytecode -- the binary code for executing logic on Ethereum. The EVM bytecode that is then stored on the blockchain is the value that is returned by running the content of init on the EVM. The bytecode can refer to itself through the opcode CODECOPY. This transfers the currently running bytecode to the EVM memory. The CODECOPY opcode reads three values on the stack where two of those values are pointers to the bytecode, one marking the beginning and one marking the end of what should be copied to memory. The RETURN opcode is then used, along with the correct values placed on the stack, to return bytecode from the initial run of the EVM code. RETURN reads and removes two pointers from the stack. These pointers define the part of the memory that is a return value. The return value of the initial contract creating run of the bytecode defines the bytecode that is stored on the blockchain and associated with the address on which you have created the smart contract.`

## Reading EVM bytecode – the basics

Before we dive into the init bytecode, we first have to collect some basic facts about how the (EVM) works. Recall that the bytecode is simply an array of bytes, and each byte will be interpreted as an operation. More precisely, appendix H of the yellow paper contains a list of opcodes each of which represents a certain operation that the machine can perform, and during execution, the EVM basically goes through the bytecode, tries to interpret each byte as an opcode and executes the corresponding operation.

The EVM is what computer scientists call a stack machine, meaning that virtually all operations somehow manipulate the stack – they take arguments from the stack, perform an operation and put the resulting value onto the stack again. Note that most operations actually consume values from the stack, i.e. pop them. As an example, let us take the ADD operation, which has bytecode 0x1. This operation takes the first two values from the stack, adds them and places the result on the stack again. So if the stack held 3 and 5 before the operation was executed, it will hold 8 after the operation has completed.

Even though most operations take their input from the stack, there are a few notable exceptions. First, there are the PUSH operations, which are needed to prepare the stack in the first place and cannot take their arguments from the stack, as this would create an obvious chicken-and-egg challenge. Instead, the `push operation` takes its argument from the code, i.e. pushes the byte or the sequence of bytes immediately following the instruction. There is one push operation for each byte length from 1 to 32, so PUSH1 pushes the byte in the code immediately following the instruction, PUSH2 pushes the next two bytes and so forth. It is important to understand that even PUSH32 will only place one item on the stack, as each stack item is a 32 byte word, using big endian notation.

## The init bytecode

Armed with this understanding, let us now start to analyze the init bytecode. We have seen that the init bytecode is stored in the transaction input, which we can, after deployment, also access as hello.tx.input. The first few bytes are.

`0x6080604052`

Let us try to understand this. First, we can look up the opcode 0x60 in the yellow paper and find that it is the opcode of `PUSH1`. Therefore, the next byte in the code is the argument to PUSH1. Then, we see the same opcode again, this time with argument 0x40. And finally, 0x52 is the opcode for MSTORE, which stores the second stack item in memory at the address given by the first stack item. Thus, in an opcode notation, this first piece of the bytecode would be

```py
    # Opcodes
    PUSH1 0x80
    PUSH1 0x40
    MSTORE


    RETURN
```

and would result in the value 0x80 being written to address 0x40 in memory. This looks a bit mysterious, but most if not all Solidity programs start with this sequence of bytes. The reason for this is the how Solidity organizes its memory internally. In fact, Solidity uses the memory area between address zero and address 0x7F for internal purposes, and stores data starting at address 0x80. So initially, free memory starts at 0x80. To keep track of which memory can still be used and which memory areas are already in use, Solidity uses the 32 bytes starting at memory address 0x40 to keep track of this free memory pointer. This is why a typical Solidity program will start by initializing this pointer to 0x80.

Finally, we RETURN. Now recalling how the return value of a contract execution is defined, we see that the return value of executing all of this is the bytearray of length 153 stored at address zero in memory, which, as we have just seen, are the 153 bytes of code starting at marker B. So the upshot is that this is the runtime bytecode, and the code we have just analyzed does nothing but (after making sure that the transaction value is zero) copying this bytecode into memory and returning it
