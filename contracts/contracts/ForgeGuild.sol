// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract ForgeGuild {
    enum Rank { Member, Knight, Elder, Leader }
    struct GuildMember { address addr; string handle; Rank rank; uint256 joinedAt; uint256 points; }
    mapping(address => GuildMember) public members;
    address[] public memberList;
    mapping(address => bool) private isMember;
    address public guildMaster;
    uint256 public joinFee = 0;
    constructor() { guildMaster = msg.sender; }
    function join(string calldata handle) external payable {
        require(msg.value >= joinFee, "pay fee"); require(!isMember[msg.sender], "already member");
        members[msg.sender] = GuildMember(msg.sender, handle, Rank.Member, block.timestamp, 0);
        memberList.push(msg.sender); isMember[msg.sender] = true;
        payable(guildMaster).transfer(msg.value);
    }
    function addPoints(address addr, uint256 pts) external {
        require(msg.sender == guildMaster, "not master");
        members[addr].points += pts;
        uint256 p = members[addr].points;
        if (p >= 1000) members[addr].rank = Rank.Leader;
        else if (p >= 500) members[addr].rank = Rank.Elder;
        else if (p >= 100) members[addr].rank = Rank.Knight;
    }
    function getMember(address addr) external view returns (GuildMember memory) { return members[addr]; }
    function totalMembers() external view returns (uint256) { return memberList.length; }
    function isMemberOf(address addr) external view returns (bool) { return isMember[addr]; }
}