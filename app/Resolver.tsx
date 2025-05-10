"use client";

import React, { useState } from "react";
import { subSeconds, formatDistanceStrict } from "date-fns";

async function resolveWithDohBrowser(hostname: string, dohServerUrl: string) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append("name", hostname);
        queryParams.append("type", "A");

        const response = await fetch(`${dohServerUrl}?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                Accept: "application/dns-json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
            return data.Answer;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

interface Answer {
    name: string;
    type: number;
    TTL: number;
    data: string;
}

const DohResolver = () => {
    const [hostname, setHostname] = useState("");
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const dohServer = "https://cloudflare-dns.com/dns-query"; // 默认 Cloudflare DoH

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHostname(event.target.value);
        setAnswers([]);
        setErrorMessage("");
    };

    const handleResolve = async () => {
        if (!hostname.trim()) {
            setErrorMessage("Please enter a valid hostname");
            return;
        }

        setIsLoading(true);
        setAnswers([]);
        setErrorMessage("");

        const result = await resolveWithDohBrowser(hostname.trim(), dohServer);
        setIsLoading(false);

        if (result) {
            setAnswers(result);
        } else {
            setErrorMessage(`Cannot resolve: ${hostname}`);
        }
    };

    function formatTTL(seconds: number): string {
        const pastDate = subSeconds(new Date(), seconds);
        const now = new Date();

        return formatDistanceStrict(pastDate, now, { addSuffix: false });
    }

    return (
        <div className="w-full h-full md:w-2/3 xl:w-1/2 pt-8 md:pt-32 px-8">
            <h2 className="text-2xl font-semibold mb-1">Online DNS Resolver Demo</h2>
            <p className="mb-4 text-sm font-semibold">
                Enter a hostname below to resolve its IP address directly in your browser.
            </p>
            <div className="mb-4">
                <label htmlFor="hostname" className="block text-sm font-bold mb-1">
                    Hostname:
                </label>
                <input
                    type="text"
                    id="hostname"
                    className="shadow appearance-none border rounded w-full py-2 px-3
                     leading-tight focus:outline-none"
                    value={hostname}
                    onChange={handleInputChange}
                    placeholder="example.com"
                />
            </div>
            <button
                className="bg-black hover:bg-black/80 duration-150 text-white
                dark:bg-white dark:text-black dark:hover:bg-white/80
                font-semibold py-2 px-4 text-sm rounded-md focus:outline-none focus:shadow-outline"
                onClick={handleResolve}
                disabled={isLoading}
            >
                {isLoading ? "Resolving..." : "Resolve"}
            </button>

            {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
            {answers.length !== 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold">Answers:</h2>
                    {answers.map((answer, index) => (
                        <div key={index}>
                            <div className="hidden md:flex mt-4 gap-6 justify-between items-center">
                                <div className="px-3 text-sm font-bold bg-green-300 dark:bg-green-600 rounded">A</div>
                                <span className="font-medium font-mono">{answer.name}</span>
                                <span className="font-medium font-mono">TTL {formatTTL(answer.TTL)}</span>
                                <span className="font-semibold font-mono w-44 text-right">{answer.data}</span>
                            </div>

                            <div className="flex flex-col md:hidden mt-4 gap-0.5">
                                <div className="flex items-center gap-6">
                                    <div className="px-3 h-5 text-sm font-bold bg-green-300 dark:bg-green-600 rounded">
                                        A
                                    </div>
                                    <span className="font-medium font-mono">{answer.name}</span>
                                    <span className="font-medium font-mono">TTL {formatTTL(answer.TTL)}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-semibold font-mono">{answer.data}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-gray-500 dark:text-neutral-300 text-sm mt-8">
                Powered by{" "}
                <a href="https://cloudflare-dns.com/" target="_blank" rel="noopener noreferrer" className="underline">
                    Cloudflare Public DNS
                </a>
            </p>
        </div>
    );
};

export default DohResolver;
