import { NextRequest, NextResponse } from "next/server";

type NominatimAddress = {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    state_code?: string;
};

type NominatimResponse = {
    address?: NominatimAddress;
};

export async function GET(request: NextRequest) {
    const latitude = Number(request.nextUrl.searchParams.get("lat"));
    const longitude = Number(request.nextUrl.searchParams.get("lng"));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return NextResponse.json(
            {
                error: "Localização inválida.",
            },
            {
                status: 400,
            }
        );
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
                headers: {
                    "User-Agent": "LosHermanosDelivery/1.0",
                    "Accept-Language": "pt-BR",
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error("Não foi possível identificar o endereço.");
        }

        const data = (await response.json()) as NominatimResponse;
        const address = data.address;

        if (!address) {
            throw new Error("Endereço não encontrado.");
        }

        return NextResponse.json({
            street: address.road ?? address.pedestrian ?? "",
            number: address.house_number ?? "",
            neighborhood: address.suburb ?? address.neighbourhood ?? address.quarter ?? "",
            city: address.city ?? address.town ?? address.village ?? address.municipality ?? "",
            state: address.state_code?.replace("BR-", "") ?? "",
            zipCode: address.postcode?.replace(/\D/g, "") ?? "",
            latitude,
            longitude,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível identificar o endereço.",
            },
            {
                status: 500,
            }
        );
    }
}
