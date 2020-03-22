# letItRain

This suite of programs gathers the collected coins on a set of blockchain addresses that belong to a certain seed. It exchanges those coins for KMD and distributes the obtained KMD balance to a set of CCL holders. The program runs in a 24 hour step, which means that once every day coins are collected, exchanged for KMD and distributed.

## what do you need to run `letItRain`?

The program requires both a full node of KMD and CCL. So the first step is to install the komodo software, e.g. from [here](https://developers.komodoplatform.com/basic-docs/start-here/about-komodo-platform/simple-installations.html). The program also requires the AtomicDEX marmetmaker, from [here](https://developers.komodoplatform.com/basic-docs/atomicdex/atomicdex-tutorials/how-to-become-a-liquidity-provider.html#how-to-become-a-liquidity-provider-on-atomicdex). Follow these instructions up to (including) step2. And of course you need to pull the letItRain repository towards the machine it will run on.

After those steps we can configure the system. A couple of processes need to run, which can be monitored in a couple of screens. To easily find your way in the set of the screens, you can give them a name: e.g. `screen -S KMD` is a good name for the KMD full node to run in.

### screen-1
In the directory `~/komodo/src` start up the KMD full node, with the command: `./komodod -addressindex=1 -spentindex=1`. 

### screen-2
In the directory `~/komodo/src` start up the CCL full node, with the command: `./komodod -ac_name=CCL -addressindex=1 -spentindex=1`.

### screen-3
Once the KMD and CCL nodes are fully synced, the following steps are required:
* create a KMD address: `./komodo-cli getnewaddress`. Once again, from the `~/komodo/src` directory.
* obtain the private key: `./komodo-cli dumpprivkey "<insert the new KMD address here>"`, and store it in a safe place
* choose an RPC password for communicating with the marketmaker
* store the KMD address and the RPC password in environtment variables, e.g. by putting them in the file `~/.bash_profile`
```
export KMD_DIST_ADDR=<YOUR ADDRESS HERE>
export USERPASS=<YOUR PASSWORD HERE>
```

### screen-4
In this screen we will start up the marketmaker. Following the instructions above this will be done by running `./start.sh` from the `~/atomicDEX-API/target/debug` directory. There is no need to connect to all coin networks here. This will be done directly from the letItRain app. Use the seed to derive the addresses for all the coins to be sent to, so letItRain can pick them up from those addresses.

### screen-5
Now it's time to run the letItRain app. You will need node.js and npm for this. Install the dependencies by running `npm install` in the `~/letItRain` directory. After this we are all set: Run `node app` to start the program and wait for the funds to be distributed.

## When does it do what?
letItRain runs on UTC time.
* 12 pm: For all available funds (except KMD) an order is created to trade them for KMD. Depending on the orderbook a maker order is created or an available order is taken, whichever delivers more KMD. For a maker order the price is set at a discount to facilitate quick trades. Orders are only created for values over 1US$ and order sizes over 0.008 (marketmaker actually requires them to be larger than 0.00777 :smile:) 
* 10 pm: All open orders are cancelled, just to make sure...
* 11 pm: all gathered KMD is sent to the KMD address of the distributor. Only amounts larger than 0.001 KMD are sent to avoid dust errors. 
* 12 am: all KMD on the distributor address is distributed over the entitled addresses.

## Some remarks
* Contrary to what the documentation tells, mm2 still runs on net id '9999' instead of the mentioned '0'.
* The mm2 requires some ETH as gas for ERC-20 token trades. letItRain makes sure that an existing ETH balance will not be drained to make sure eventual ERC-20 trades can successfully complete. If you build a letItRain system from scratch, make sure to fund the mm2 ETH address with some change.
