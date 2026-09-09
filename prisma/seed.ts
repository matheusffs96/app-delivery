import {
    PrismaClient,
    ProductType,
    StorePaymentMethod,
    WeekDay,
} from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Iniciando seed...");

    // ============================================================
    // STORE
    // ============================================================

    const store = await prisma.store.upsert({
        where: {
            id: "store-principal",
        },
        update: {
            name: "Los Hermanos",
            active: true,
            acceptingOrders: true,
        },
        create: {
            id: "store-principal",
            name: "Los Hermanos",
            phone: "(18) 9 8153-8213",
            description: "Cocina Mexicana",
            active: true,
            acceptingOrders: true,
        },
    });

    const storePaymentMethod: StorePaymentMethod[] = [
        {
            storeId: store.id,
            method: "PIX",
            active: true,
        },
        {
            storeId: store.id,
            method: "CREDIT_CARD",
            active: false,
        },
        {
            storeId: store.id,
            method: "DEBIT_CARD",
            active: false,
        },
        {
            storeId: store.id,
            method: "CASH",
            active: true,
        },
    ];

    await prisma.storePaymentMethod.createMany({
        data: storePaymentMethod,
        skipDuplicates: true,
    });

    // ============================================================
    // CATEGORIES
    // ============================================================

    const individuais = await prisma.category.upsert({
        where: {
            slug: "individuais",
        },
        update: {
            name: "Individuais",
            sortOrder: 1,
            active: true,
        },
        create: {
            name: "Individuais",
            slug: "individuais",
            sortOrder: 1,
            active: true,
        },
    });

    const combos = await prisma.category.upsert({
        where: {
            slug: "combos",
        },
        update: {
            name: "Combos",
            sortOrder: 2,
            active: true,
        },
        create: {
            name: "Combos",
            slug: "combos",
            sortOrder: 2,
            active: true,
        },
    });

    const complementos = await prisma.category.upsert({
        where: {
            slug: "complementos",
        },
        update: {
            name: "Complementos",
            sortOrder: 3,
            active: true,
        },
        create: {
            name: "Complementos",
            slug: "complementos",
            sortOrder: 3,
            active: true,
        },
    });

    // ============================================================
    // PRODUCTS
    // ============================================================

    const burrito = await prisma.product.upsert({
        where: {
            slug: "burrito-completo",
        },
        update: {
            name: "Burrito Completo",
            price: "29.90",
            type: ProductType.COMPOSITE,
            categoryId: individuais.id,
            active: true,
            sortOrder: 1,
        },
        create: {
            name: "Burrito Completo",
            slug: "burrito-completo",
            description: "Monte seu burrito do seu jeito.",
            price: "29.90",
            type: ProductType.COMPOSITE,
            categoryId: individuais.id,
            active: true,
            sortOrder: 1,
        },
    });

    const nachos = await prisma.product.upsert({
        where: {
            slug: "porcao-de-nachos",
        },
        update: {
            name: "Porção de Nachos",
            price: "24.90",
            type: ProductType.SIMPLE,
            categoryId: individuais.id,
            active: true,
            sortOrder: 2,
        },
        create: {
            name: "Porção de Nachos",
            slug: "porcao-de-nachos",
            description: "Porção de nachos.",
            price: "24.90",
            type: ProductType.SIMPLE,
            categoryId: individuais.id,
            active: true,
            sortOrder: 2,
        },
    });

    const guacamole = await prisma.product.upsert({
        where: {
            slug: "guacamole",
        },
        update: {
            name: "Guacamole",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 1,
        },
        create: {
            name: "Guacamole",
            slug: "guacamole",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 1,
        },
    });

    const feijao = await prisma.product.upsert({
        where: {
            slug: "feijao-cremoso",
        },
        update: {
            name: "Feijão Cremoso",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 2,
        },
        create: {
            name: "Feijão Cremoso",
            slug: "feijao-cremoso",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 2,
        },
    });

    const pico = await prisma.product.upsert({
        where: {
            slug: "pico-de-gallo",
        },
        update: {
            name: "Pico de Gallo",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 3,
        },
        create: {
            name: "Pico de Gallo",
            slug: "pico-de-gallo",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 3,
        },
    });

    const cremeAzedo = await prisma.product.upsert({
        where: {
            slug: "creme-azedo",
        },
        update: {
            name: "Creme Azedo",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 4,
        },
        create: {
            name: "Creme Azedo",
            slug: "creme-azedo",
            price: "8.90",
            type: ProductType.SIMPLE,
            categoryId: complementos.id,
            active: true,
            sortOrder: 4,
        },
    });

    const combo = await prisma.product.upsert({
        where: {
            slug: "burrito-em-dobro",
        },
        update: {
            name: "Burrito em Dobro",
            price: "59.90",
            type: ProductType.COMBO,
            categoryId: combos.id,
            active: true,
            sortOrder: 1,
        },
        create: {
            name: "Burrito em Dobro",
            slug: "burrito-em-dobro",
            description: "2 burritos do seu jeito + 1 porção de nachos.",
            price: "59.90",
            type: ProductType.COMBO,
            categoryId: combos.id,
            active: true,
            sortOrder: 1,
        },
    });

    // ============================================================
    // BURRITO - OPTION GROUP: CARNE
    // ============================================================

    const carneGroup = await prisma.optionGroup.upsert({
        where: {
            id: "burrito-carne",
        },
        update: {
            name: "Carne",
            required: true,
            minSelect: 1,
            maxSelect: 1,
            sortOrder: 1,
            active: true,
            productId: burrito.id,
        },
        create: {
            id: "burrito-carne",
            name: "Carne",
            required: true,
            minSelect: 1,
            maxSelect: 1,
            sortOrder: 1,
            active: true,
            productId: burrito.id,
        },
    });

    const meats = [
        "Pernil desfiado",
        "Peito de frango desfiado",
        "Lombo suíno assado",
        "Sobrecoxa de frango assada",
        "Carne bovina",
    ];

    for (let i = 0; i < meats.length; i++) {
        await prisma.option.upsert({
            where: {
                id: `burrito-carne-${i + 1}`,
            },
            update: {
                name: meats[i],
                price: "0",
                active: true,
                sortOrder: i + 1,
                optionGroupId: carneGroup.id,
            },
            create: {
                id: `burrito-carne-${i + 1}`,
                name: meats[i],
                price: "0",
                active: true,
                sortOrder: i + 1,
                optionGroupId: carneGroup.id,
            },
        });
    }

    // ============================================================
    // BURRITO - COMPONENT GROUP: ACOMPANHAMENTOS
    // ============================================================

    const acompanhamentosGroup = await prisma.productComponentGroup.upsert({
        where: {
            id: "burrito-acompanhamentos",
        },
        update: {
            name: "Acompanhamentos",
            required: false,
            minSelect: 0,
            maxSelect: 2,
            sortOrder: 1,
            active: true,
            productId: burrito.id,
        },
        create: {
            id: "burrito-acompanhamentos",
            name: "Acompanhamentos",
            required: false,
            minSelect: 0,
            maxSelect: 2,
            sortOrder: 1,
            active: true,
            productId: burrito.id,
        },
    });

    const acompanhamentoProducts = [
        {
            id: "burrito-acomp-feijao",
            productId: feijao.id,
            sortOrder: 1,
        },
        {
            id: "burrito-acomp-pico",
            productId: pico.id,
            sortOrder: 2,
        },
        {
            id: "burrito-acomp-creme",
            productId: cremeAzedo.id,
            sortOrder: 3,
        },
    ];

    for (const item of acompanhamentoProducts) {
        await prisma.productComponentGroupItem.upsert({
            where: {
                id: item.id,
            },
            update: {
                groupId: acompanhamentosGroup.id,
                productId: item.productId,
                additionalPrice: "0",
                sortOrder: item.sortOrder,
                active: true,
            },
            create: {
                id: item.id,
                groupId: acompanhamentosGroup.id,
                productId: item.productId,
                additionalPrice: "0",
                sortOrder: item.sortOrder,
                active: true,
            },
        });
    }

    await prisma.productComponentOption.upsert({
        where: {
            id: "burrito-acomp-queijo",
        },
        update: {
            name: "Queijo mussarela",
            additionalPrice: "0",
            sortOrder: 4,
            active: true,
            groupId: acompanhamentosGroup.id,
        },
        create: {
            id: "burrito-acomp-queijo",
            name: "Queijo mussarela",
            additionalPrice: "0",
            sortOrder: 4,
            active: true,
            groupId: acompanhamentosGroup.id,
        },
    });

    // ============================================================
    // BURRITO - COMPONENT GROUP: COMPLEMENTOS
    // ============================================================

    const complementosGroup = await prisma.productComponentGroup.upsert({
        where: {
            id: "burrito-complementos",
        },
        update: {
            name: "Complementos",
            required: false,
            minSelect: 0,
            maxSelect: 2,
            sortOrder: 2,
            active: true,
            productId: burrito.id,
        },
        create: {
            id: "burrito-complementos",
            name: "Complementos",
            required: false,
            minSelect: 0,
            maxSelect: 2,
            sortOrder: 2,
            active: true,
            productId: burrito.id,
        },
    });

    const complementoProducts = [
        {
            id: "burrito-comp-guacamole",
            productId: guacamole.id,
            sortOrder: 1,
        },
        {
            id: "burrito-comp-feijao",
            productId: feijao.id,
            sortOrder: 2,
        },
        {
            id: "burrito-comp-pico",
            productId: pico.id,
            sortOrder: 3,
        },
        {
            id: "burrito-comp-creme",
            productId: cremeAzedo.id,
            sortOrder: 4,
        },
    ];

    for (const item of complementoProducts) {
        await prisma.productComponentGroupItem.upsert({
            where: {
                id: item.id,
            },
            update: {
                groupId: complementosGroup.id,
                productId: item.productId,
                additionalPrice: "0",
                sortOrder: item.sortOrder,
                active: true,
            },
            create: {
                id: item.id,
                groupId: complementosGroup.id,
                productId: item.productId,
                additionalPrice: "0",
                sortOrder: item.sortOrder,
                active: true,
            },
        });
    }

    await prisma.productComponentOption.upsert({
        where: {
            id: "burrito-comp-pimenta",
        },
        update: {
            name: "Molho de pimenta",
            additionalPrice: "0",
            sortOrder: 5,
            active: true,
            groupId: complementosGroup.id,
        },
        create: {
            id: "burrito-comp-pimenta",
            name: "Molho de pimenta",
            additionalPrice: "0",
            sortOrder: 5,
            active: true,
            groupId: complementosGroup.id,
        },
    });

    // ============================================================
    // BURRITO - OPTION GROUP: ARDÊNCIA
    // ============================================================

    const ardenciaGroup = await prisma.optionGroup.upsert({
        where: {
            id: "burrito-ardencia",
        },
        update: {
            name: "Ardência",
            required: true,
            minSelect: 1,
            maxSelect: 1,
            sortOrder: 3,
            active: true,
            productId: burrito.id,
        },
        create: {
            id: "burrito-ardencia",
            name: "Ardência",
            required: true,
            minSelect: 1,
            maxSelect: 1,
            sortOrder: 3,
            active: true,
            productId: burrito.id,
        },
    });

    const spiceLevels = ["Suave", "Média", "Picante"];

    for (let i = 0; i < spiceLevels.length; i++) {
        await prisma.option.upsert({
            where: {
                id: `burrito-ardencia-${i + 1}`,
            },
            update: {
                name: spiceLevels[i],
                price: "0",
                active: true,
                sortOrder: i + 1,
                optionGroupId: ardenciaGroup.id,
            },
            create: {
                id: `burrito-ardencia-${i + 1}`,
                name: spiceLevels[i],
                price: "0",
                active: true,
                sortOrder: i + 1,
                optionGroupId: ardenciaGroup.id,
            },
        });
    }

    // ============================================================
    // COMBO: BURRITO EM DOBRO
    // ============================================================

    await prisma.productComboItem.upsert({
        where: {
            id: "combo-burrito-em-dobro-burrito",
        },
        update: {
            comboProductId: combo.id,
            productId: burrito.id,
            quantity: 2,
            sortOrder: 1,
        },
        create: {
            id: "combo-burrito-em-dobro-burrito",
            comboProductId: combo.id,
            productId: burrito.id,
            quantity: 2,
            sortOrder: 1,
        },
    });

    await prisma.productComboItem.upsert({
        where: {
            id: "combo-burrito-em-dobro-nachos",
        },
        update: {
            comboProductId: combo.id,
            productId: nachos.id,
            quantity: 1,
            sortOrder: 2,
        },
        create: {
            id: "combo-burrito-em-dobro-nachos",
            comboProductId: combo.id,
            productId: nachos.id,
            quantity: 1,
            sortOrder: 2,
        },
    });

    // ============================================================
    // BUSINESS HOURS
    // ============================================================

    const businessHours = [
        [WeekDay.SUNDAY, "18:00", "23:00"],
        [WeekDay.MONDAY, "18:00", "23:00"],
        [WeekDay.TUESDAY, "18:00", "23:00"],
        [WeekDay.WEDNESDAY, "18:00", "23:00"],
        [WeekDay.THURSDAY, "18:00", "23:00"],
        [WeekDay.FRIDAY, "18:00", "23:30"],
        [WeekDay.SATURDAY, "18:00", "23:30"],
    ] as const;

    for (const [dayOfWeek, openTime, closeTime] of businessHours) {
        await prisma.businessHour.upsert({
            where: {
                id: `store-hours-${dayOfWeek}`,
            },
            update: {
                storeId: store.id,
                dayOfWeek,
                openTime,
                closeTime,
                active: true,
            },
            create: {
                id: `store-hours-${dayOfWeek}`,
                storeId: store.id,
                dayOfWeek,
                openTime,
                closeTime,
                active: true,
            },
        });
    }

    console.log("✅ Seed concluído!");
    console.log("");

    const storePaymentMethodLabel =
        storePaymentMethod.filter((item) => item.active).length === 0
            ? "nenhum"
            : storePaymentMethod
                  .filter((item) => item.active)
                  .map((item) => item.method)
                  .join(", ");

    console.log(`Loja ${store.name} criada`);
    console.log(`Métodos de pagamentos configurados: ${storePaymentMethodLabel}`);
    // console.log(`Produtos criados: ${0}`);
}

main()
    .catch((error) => {
        console.error("❌ Erro no seed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
