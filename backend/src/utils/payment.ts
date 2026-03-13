import { createHash, randomBytes } from "node:crypto";
import { Agent, fetch as undiciFetch } from "undici";

const PAYMENT_URL = "https://api.ftl.name/site/input.php";

export type PaymentInfo = {
    paid: boolean;
    payUrl: string | null;
};

export async function requestPaymentInfo(params: {
    teamId: number;
    teamName: string;
    teamSchool: string;
}): Promise<PaymentInfo> {
    const saltKey = process.env.PAYMENT_SOLT_KEY;
    if (!saltKey) {
        throw new Error("PAYMENT_SOLT_KEY is not set");
    }

    const rnd = randomBytes(16).toString("hex");
    const time = Math.floor(Date.now() / 1000).toString();
    const ctrl = createHash("md5").update(`${rnd}${saltKey}${time}`).digest("hex");

    const dispatcher = new Agent({
        connect: { rejectUnauthorized: false },
    });
    const body = new URLSearchParams({
        _rnd: rnd,
        _time: time,
        _ctrl: ctrl,
        _name: params.teamName,
        _sch: params.teamSchool,
        _int: String(params.teamId),
    });

    console.log(body.toString());
    const response = await undiciFetch(PAYMENT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        dispatcher,
    });
    const raw = await response.text();
    console.log(raw);

    let payload: any;
    try {
        payload = JSON.parse(raw);
    } catch {
        throw new Error(`Invalid payment response: ${raw}`);
    }

    if (!Array.isArray(payload) || payload.length < 2) {
        throw new Error(`Unexpected payment response: ${raw}`);
    }

    const [ok, data] = payload;
    if (!ok) {
        const msg = typeof data === "string" ? data : "Payment request failed";
        throw new Error(msg);
    }

    let paid = false;
    let payUrl: string | null = null;

    if (Array.isArray(data)) {
        paid = Boolean(data[0]);
        payUrl = typeof data[1] === "string" && data[1].length > 0 ? data[1] : null;
    } else {
        paid = Boolean(data?.status);
        payUrl = typeof data?.pay_url === "string" && data.pay_url.length > 0
            ? data.pay_url
            : null;
    }

    return { paid, payUrl };
}
