//TODO: REMOVE TEST FEATURE

export const messRoutine = {
  Monday: {
    Breakfast:
      "Bara Ghuguni/Dahi Bara, Aloo Dum(Alt), Bread Butter(1pc), Jam (2pc), Tea",
    Lunch:
      "Rice, Roti, Dal, Aloo Gobi Curry, Saga Muga, Aloo Chips/Dahi (Alt), Mix Boiled Vegetable (without Potato)",
    Snacks: "Jhal Mudhi, Tea",
    Dinner:
      "Rice, Paratha, Dal Makhani, Paneer Bhurjee, Malpua/Jalebi (1pc), Mix Boiled Vegetable (without Potato)",
  },
  Tuesday: {
    Breakfast: "Spiral Pasta, Sauce, Corn Flakes, Milk, Banana(2 pc), Coffee",
    Lunch:
      "Jeera Rice, Roti, Chana Dal, Rajma Masala, Dahi Bundi, French Fries/ Mix Boiled Vegetable (without Potato)",
    Snacks: "Aloo Chuopi Piazi, Tea",
    Dinner:
      "Rice, Roti, Dal Paneer Aloo Kofta/Soya Chilli(Alt), Tomato Chutney, Gulab Jamun (1 pc), Mix Boiled Vegetable (without Potato)",
  },
  Wednesday: {
    Breakfast: "Bread Jam (1pc), Jam (1pc), Boiled Egg(2pc), Cutlet (2pc), Tea",
    Lunch:
      "Rice, Roti, Dal, Fish Masala, Paneer 65, Tomato Khajuri Khatta, Aloo Chokha, Fries, Mix Boiled Vegetable (without Potato)",
    Snacks: "Samosa/Gobi Pakoda(Alt), Sauce, Coffee",
    Dinner:
      "Rice, Roti, Kadai Paneer, Chicken Kassa, Boondi, Papad, Mix Boiled Vegetable (without Potato)",
  },
  Thursday: {
    Breakfast:
      "Puri, Ghuguni/Chole, Bhature (Alt), Corn Flakes, Milk, Banana (2 pc), Tea",
    Lunch:
      "Rice, Roti, Moong Dal, Mixed Veg, Dahi Kadi, Pickles, Mix Boiled Vegetable (without Potato)",
    Snacks: "Nestle Maggi, Tomato Sauce, Coffee",
    Dinner:
      "Jeera Rice, Roti, Mixed Tadka, Soya Chilli Paneer, Aloo Kofta(Alt), Veg Soup, Rabu Hogo, Mix Boiled Vegetable (without Potato)",
  },
  Friday: {
    Breakfast:
      "Egg Omelet (2pc), Bread, Jam (1 pc), Butter (1pc), Veg Paneer Chowmin/Upama, Ghuguni, Tea",
    Lunch:
      "Rice, Roti, Dal, Fish Curry Home Style, Mutter Gobi Fry, Salad, Karela Aloo Chips, Mix Boiled Vegetable (without Potato)",
    Snacks: "Biscuit (4pc), Rusk (4pc), Tea",
    Dinner:
      "Veg Biryani, Chicken Biryani, Dahi Raita, Paneer Butter Masala, Mix Boiled Vegetable (without Potato)",
  },
  Saturday: {
    Breakfast: "Poha Upma/Suji Upma, Corn Flakes, Milk, Banana(2 pc), Coffee",
    Lunch:
      "Rice, Roti, Mix Dal, Veg Manchurian, Egg Curry Home Style, Plain Curd, French Fry, Mix Boiled Vegetables (without Potato)",
    Snacks: "Motor Fry, Lemon Tea",
    Dinner:
      "Rice, Roti, Dal, Chilli Paneer, Chilli Chicken, Kulfi, Mixed Boiled Vegetables",
  },
  Sunday: {
    Breakfast: "Masala Dosa, Sambar, Chutney, Bread, Jam, Butter, Tea",
    Lunch:
      "Rice, Roti, Dal, Chicken Mughali, Chole Masala, Tomato Chutney, Papad (Sriram), Mixed Boiled Vegetables",
    Snacks: "Papudi Chat, Coffee",
    Dinner:
      "Rice, Roti, Dal, Egg Burji, Cauli Flower Manchurian, Fruit Custard, Mixed Boiled Vegetables",
  },
};

export const getMessFood = async ({
  day,
  type,
}: {
  day: keyof typeof messRoutine;
  type: "Breakfast" | "Lunch" | "Snacks" | "Dinner";
}) => {
  const dayFood = messRoutine[day];
  if (!dayFood) {
    return "No Food Available for the day";
  }
  return dayFood[type];
};
