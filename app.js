 
function average(total, count) {
    if (count === 0) {
        return 0;
    }

    return total / count;
}
function isLargeSuccess (transaction,minAmount ) {
    if (transaction.status === "success" && transaction.amount >= minAmount) {
        return true;
    }
    else {
        return false;
    }
}
function calculateStatistics(transactions) {
    let inputValue = document.getElementById("minAmount").value;

    if (inputValue === "") {
        document.getElementById("result").textContent = "请输入最低金额";
        return;
    }

    let minAmount = Number(inputValue);
if (minAmount < 0) {
    document.getElementById("result").textContent = "最低金额不能为负数";
    return;
}
    if (minAmount > 500) {
        document.getElementById("result").textContent = "最低金额不能大于500";
        return;
    }

     
let total = 0;
let count = 0;

let list = document.getElementById("transactionList");
list.textContent = "";

for (let transaction of transactions) {
        if (isLargeSuccess(transaction, minAmount)) {
            total += transaction.amount;
            count++;
         let item = document.createElement("li");
item.textContent =
    "编号："+transaction.id+",金额：" + transaction.amount + "，状态：" + transaction.status;
list.appendChild(item);   
        }
    }
if (count === 0) {
    let item = document.createElement("li");
    item.textContent = "没有符合条件的交易";
    list.appendChild(item);
}
    let averageAmount = average(total, count);
document.getElementById("result").textContent =
    "总金额：" + total + "，笔数：" + count + "，平均金额：" + averageAmount;

}

async function loadTransactions() {
    try {
        const response = await fetch("transactions.json");

        if (!response.ok) {
            throw new Error("交易数据加载失败");
        }

        const data = await response.json();

        document.getElementById("calculate").addEventListener("click", function () {
            calculateStatistics(data);
        });
    } catch (error) {
        document.getElementById("result").textContent = error.message;
    }
}

loadTransactions();
async function loadBlockHeight() {
    const result = document.getElementById("blockHeight");
    result.textContent = "正在查询区块高度…";

    try {
        const response = await fetch("https://ethereum-rpc.publicnode.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_blockNumber",
                params: [],
                id: 1
            })
        });

        const data = await response.json();

        if (!response.ok || data.error || typeof data.result !== "string") {
            throw new Error("节点未返回区块高度");
        }

        result.textContent = "以太坊最新区块高度：" + Number(data.result);
    } catch (error) {
        result.textContent = "区块高度查询失败，请重试";
    }
}
loadBlockHeight();
document.getElementById("refreshBlock").addEventListener("click", loadBlockHeight);

function formatEth(wei) {
    const amount = BigInt(wei);
    const unit = 10n ** 18n;
    const whole = amount / unit;
    const fraction = (amount % unit).toString().padStart(18, "0");
    return whole.toString() + "." + fraction + " ETH";
}

async function checkBalance() {
    const address = document.getElementById("walletAddress").value;

    if (address === "") {
        document.getElementById("balanceResult").textContent = "请输入以太坊地址";
        return;
    }
const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(address);
if (!isValidAddress) {
    document.getElementById("balanceResult").textContent = "以太坊地址格式不正确";
    return;
}
    const result = document.getElementById("balanceResult");
result.textContent = "正在查询余额…";

try {
    const request = {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1
    };

    const response = await fetch("https://ethereum-rpc.publicnode.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        throw new Error("余额查询失败");
    }

    const data = await response.json();

    if (data.error || typeof data.result !== "string") {
        throw new Error("节点未返回余额");
    }

    const balanceWei = BigInt(data.result);
   const weiPerEth = 10n ** 18n;
const wholeEth = balanceWei / weiPerEth;
const remainingWei = balanceWei % weiPerEth;
const fraction = remainingWei.toString().padStart(18, "0");

result.textContent = "余额：" + formatEth(data.result);
} catch (error) {
    result.textContent = "余额查询失败，请重试";
}
}

document.getElementById("checkBalance").addEventListener("click", checkBalance);
async function connectWallet() {
    const status = document.getElementById("walletStatus");

    if (!window.ethereum) {
        status.textContent = "当前浏览器没有检测到以太坊钱包";
        return;
    }

    try {
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        document.getElementById("walletAddress").value = accounts[0];
        status.textContent = "钱包已连接";
    } catch (error) {
        status.textContent = "钱包连接未完成";
    }
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);
async function loadHistory() {
    const address = document.getElementById("walletAddress").value.trim();
 const historyResult = document.getElementById("historyResult");
const historyList = document.getElementById("historyList");
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        console.log("请输入有效的以太坊地址");
        return;
    }

    const url = "https://eth.blockscout.com/api/v2/addresses/" +
        address + "/transactions";

    try {
        historyList.textContent = "";
historyResult.textContent = "正在查询交易记录…";
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
     
const transactions = data.items.slice(0, 5);

historyList.textContent = "";
historyResult.textContent = "本次显示 " + transactions.length + " 笔交易";

for (const transaction of transactions) {
    const item = document.createElement("li");
    item.textContent =
    "时间：" + transaction.timestamp +
    "，金额：" + formatEth(transaction.value) +
    "，状态：" + transaction.status;
    historyList.appendChild(item);
}
}
    catch (error) {
        console.error("交易记录查询失败", error);
        historyResult.textContent = "交易记录查询失败，请重试";
    }
 }
document.getElementById("loadHistory").addEventListener("click", loadHistory);
