# ChainCredID

ChainCredID is a decentralized application (dApp) designed to provide secure and verifiable attestation services on the Ethereum blockchain, leveraging the advanced capabilities of Scroll L2 for scalability and efficiency, alongside the Ethereum Attestation Service (EAS) for robust attestation processing.

## Technologies Used

- **Scroll L2**: A layer 2 scaling solution for Ethereum that enhances transaction speed and reduces costs, making it ideal for dApps requiring high throughput.
- **Ethereum Attestation Service (EAS)**: A decentralized protocol for creating, storing, and verifying off-chain data with on-chain attestations, providing a secure and immutable verification mechanism.
- **Chainlink Automations**: Automate your smart contract with Chainlink’s hyper-reliable Automation network.

## Contract Address

The smart contract for ChainCredID is deployed at `0x981F5a4F664A7c7cC601bEd121505B6d2fBD3C80` on the Scroll Layer 2 (Sepolia Testnet) network. You can verify the contract details and source code at [Sepolia ScrollScan](https://sepolia.scrollscan.dev/address/0x981f5a4f664a7c7cc601bed121505b6d2fbd3c80#code).

You can check the sample schema we used on this project [here](https://scroll-sepolia.easscan.org/schema/view/0x6f0ae5ac9195bd29d2e9942d12d313d157da57ce56be88ab2c97bf94d39f6f5e).

## Access the Application

ChainCredID is accessible through its dedicated portals:

- **Home Page**: [chaincredid.pages.dev](https://chaincredid.pages.dev)
- **User Portal**: [User Portal](https://chaincredid.pages.dev/user)
- **Admin Portal**: [Admin Portal](https://chaincredid.pages.dev/admin)

- **VotingHub**: [VotingHub](https://chaincredid.pages.dev/voting)
  Important VotingHub Chainlink Upkeep is working. Which is why StartVoting button display a message "Voting Already Active". Which means it's working properly! Check the images below or the Console. 

  
## Overview

ChainCredID offers a user-friendly interface allowing individuals to have various rights and credentials attested within a secure and transparent environment. Utilizing the power of smart contracts, users can request attestations for rights such as voting, drinking, or entering the country. Administrators, on the other hand, can manage and verify these attestations through the admin portal, ensuring a robust and trustless verification process.

## Getting Started

To interact with ChainCredID, visit the home page and choose the relevant portal based on your role (user or admin). Ensure you have a compatible Ethereum wallet (e.g., MetaMask) connected to the Sepolia test network for transactions.

For users wishing to have their rights attested, navigate to the user portal, where you can submit your requests. Admins can review and process these requests via the admin portal, leveraging the functionalities provided by the Ethereum Attestation Service to ensure each attestation's integrity and verifiability.

# Citizen Database Project

## Overview

For our Citizen Database, we utilized Chainlink to automate the voting periods.

Voting is initiated from the front end, with a set duration for the voting process. Remarkably, Chainlink Automations manage the voting period automatically, eliminating the need for manual intervention.

### Chainlink Autommation Addresses

- **Upkeep Address:** `0xfd4a3A7533C52402259d25edcF0Ff876E8C3b153`
- **Upkeep ID:** `51587618327586771612208838368581969863669885174738854649399751226007644174500`
- **Voting Contract Address (ETH SEPOLIA):** `0x9108484E28FFb83F538a570C3a8af5E4210Db9c5`

## Benefits of Using Chainlink Automation

- **Decentralization:** Enhances security and reliability by eliminating centralized points of failure.
- **Efficiency:** Saves time and reduces the DevOps workload through optimized infrastructure for smart contract execution.
- **Security:** Bolsters protocol security by signing on-chain transactions via the Chainlink Automation Network, thus avoiding the exposure of private keys.
- **Cost Efficiency:** Lowers gas fees and maintains them within predictable ranges.
- **Reliability:** Features a redesigned algorithm for dependable execution of high-frequency functions.
- **Scheduling:** Offers a no-code UI for the timely scheduling of smart contract upkeep jobs, ideal for managing voting periods.
- **Off-chain Computation Improvements:** Minimizes reverts and conserves funds with an enhanced off-chain simulation process.

## Integration with Ethereum Attestations Service

We aimed to integrate this with our Ethereum Attestations Service on Scroll. However, Chainlink Automations have not yet been introduced to the Scroll network. We plan to utilize Chainlink Automation for attestations in the future. We implemented a Voting contract on Ethereum Sepolia to enhance our dApp's functionalities and demonstrate the application of Chainlink Automation in voting processes. Integrating Chainlink Automation for attestation expiration presents challenges, as it typically responds to on-chain state changes, whereas attestation expiration depends on time rather than state.

## Development and Future Plans

Our commits demonstrate our successful integration of Chainlink Automations, though we continue to explore other Chainlink services. We even managed to set up our own Chainlink Node on Google Cloud. Given the time constraints and the associated costs (Google Cloud is expensive), our ambitions remain high for fully leveraging Chainlink Functions to connect to a database and further enhance our dApp's features.

We are committed to advancing our project, hopeful that it will attract government interest.

### Chainlink Node Running on Google Cloud

> ![Chainlink Node running on Google Cloud](https://github.com/maxsorto/ChainCredID/blob/4efe22ab317d711e7e21604fc118e40f23082551/front/assets/images/chainlinkNode.png)
>![UpkeepWorks! VotingAlreadyActive](https://github.com/maxsorto/ChainCredID/blob/3eaed8326c44a6dbe8e9b2e897a833bd4c63b94e/front/assets/images/VotingActive.png)
> ![VotingAlreadyActive](https://github.com/maxsorto/ChainCredID/blob/3eaed8326c44a6dbe8e9b2e897a833bd4c63b94e/front/assets/images/VotingISActive.png)




## Acknowledgements

Finally, we express our gratitude for this engaging opportunity. The support from the sponsors has been invaluable, and we appreciate their responsiveness to our frequent communications. The experience at ETH Latam was thoroughly enjoyable, and we look forward to participating in future events. Let's continue to innovate and build together!


## Future Developments

Post-ETH LATAM Hackathon 2024, the ChainCredID team is committed to continuing the development and improvement of the platform. We aim to integrate more features, enhance user experience, and expand the scope of attestable rights, further contributing to the Ethereum community's growth and the broader blockchain-based digital identity management ecosystem.
