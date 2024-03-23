// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract CitizenDatabase {
    
    struct Citizen {
        bool canVote;
        bool canDrink;
        bool canEnterCountry;
        uint256 birthTimestamp; // Birthday in MM/DD/YYYY format
    }

    mapping(address => Citizen) public citizens;

    AggregatorV3Interface internal timeOracle;

    event Attestation(address indexed citizen);

    constructor(address _timeOracle) {
        timeOracle = AggregatorV3Interface(_timeOracle);
    }

    function addCitizen(
        address _userAddress,
        bool _canVote,
        bool _canDrink,
        bool _canEnterCountry,
        string memory _birthday
    ) public {
        uint256 birthTimestamp = parseBirthdayToTimestamp(_birthday);
        citizens[_userAddress] = Citizen(_canVote, _canDrink, _canEnterCountry, birthTimestamp);
    }

    function attestRightToVote(address _userAddress) public {
        require(!citizens[_userAddress].canVote && isCitizenOldEnough(_userAddress));
        citizens[_userAddress].canVote = true;
        emit Attestation(_userAddress);
    }

    function attestRightToDrink(address _userAddress, bool _canDrink) public {
        require(!citizens[_userAddress].canDrink);
        citizens[_userAddress].canDrink = _canDrink;
        emit Attestation(_userAddress);
    }

    function attestRightToEnterCountry(address _userAddress, bool _canEnterCountry) public {
        require(!citizens[_userAddress].canEnterCountry);
        citizens[_userAddress].canEnterCountry = _canEnterCountry;
        emit Attestation(_userAddress);
    }

    function verifyRightToVote(address _citizen) public view returns (bool) {
        return citizens[_citizen].canVote;
    }

    function verifyRightToDrink(address _citizen) public view returns (bool) {
        return citizens[_citizen].canDrink;
    }

    function verifyRightToEnterCountry(address _citizen) public view returns (bool) {
        return citizens[_citizen].canEnterCountry;
    }

    function parseBirthdayToTimestamp(string memory _birthday) internal view returns (uint256) {
        // Split birthday string to extract day, month, and year
        bytes memory b = bytes(_birthday);
        bytes memory day = new bytes(2);
        bytes memory month = new bytes(2);
        bytes memory year = new bytes(4);
        day[0] = b[0];
        day[1] = b[1];
        month[0] = b[3];
        month[1] = b[4];
        year[0] = b[6];
        year[1] = b[7];
        year[2] = b[8];
        year[3] = b[9];
        
        // Convert bytes to uint
        uint256 dayNum = uint8(day[0]) * 10 + uint8(day[1]) - 48 * 10;
        uint256 monthNum = uint8(month[0]) * 10 + uint8(month[1]) - 48 * 10;
        uint256 yearNum = uint8(year[0]) * 1000 + uint8(year[1]) * 100 + uint8(year[2]) * 10 + uint8(year[3]) - 48 * 1000;
        
        // Convert birthday to Unix timestamp
        return toTimestamp(yearNum, monthNum, dayNum);
    }

    function toTimestamp(uint256 _year, uint256 _month, uint256 _day) internal pure returns (uint256) {
        uint256 timestamp = 0;
        uint256 secondsInDay = 86400; // 24 hours * 60 minutes * 60 seconds

        // Year
        timestamp += (_year - 1970) * 365 * secondsInDay;
        for (uint256 i = 1970; i < _year; i++) {
            if (isLeapYear(i)) {
                timestamp += secondsInDay;
            }
        }

        // Month
        uint256[12] memory monthDays;
        monthDays[0] = 31;
        monthDays[1] = isLeapYear(_year) ? 29 : 28;
        monthDays[2] = 31;
        monthDays[3] = 30;
        monthDays[4] = 31;
        monthDays[5] = 30;
        monthDays[6] = 31;
        monthDays[7] = 31;
        monthDays[8] = 30;
        monthDays[9] = 31;
        monthDays[10] = 30;
        monthDays[11] = 31;
        
        for (uint256 i = 0; i < _month - 1; i++) {
            timestamp += monthDays[i] * secondsInDay;
        }

        // Day
        timestamp += (_day - 1) * secondsInDay;

        return timestamp;
    }


    function isLeapYear(uint256 _year) internal pure returns (bool) {
        if (_year % 4 != 0) {
            return false;
        }
        if (_year % 100 != 0) {
            return true;
        }
        if (_year % 400 != 0) {
            return false;
        }
        return true;
    }

    function isCitizenOldEnough(address _citizenAddress) internal view returns (bool) {
        uint256 age = calculateAge(_citizenAddress);
        return age >= 18;
    }

    function calculateAge(address _citizenAddress) internal view returns (uint256) {
        uint256 birthTimestamp = citizens[_citizenAddress].birthTimestamp;
        (, int256 currentTime, , , ) = timeOracle.latestRoundData();
        uint256 ageInSeconds = uint256(currentTime) - birthTimestamp;
        uint256 ageInYears = ageInSeconds / 31556952; // 31556952 seconds in a year (average value)
        return ageInYears;
    }

    
}
