const Category = require("../models/categoryModel");

const createCategory = async (req, res) => {
    try {
        const name = req.body.name;
        const dis = req.body.description;
        const existingcate = await Category.findOne({
            name: name.toLowerCase(),
        });

        if (existingcate) {
            const categorydetails = await Category.find();
            res.render('admin/category', { category: categorydetails, message: 'category name already exists' });
        } else {
            const cat = new Category({
                name: name.toLowerCase(),
                description: dis,
            });
            await cat.save();
            const categorydetails = await Category.find();
            res.render('admin/category', { category: categorydetails, message: 'Category added successfully!' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
};

const loadCategory = async(req,res)=>{
    try{
      const category = await Category.find({});  
      res.render('admin/category',{category, message: 'Welcome back to category page'});
    } catch(error){
        console.log(error.message);
    }
}

const editCategoryLoad = async (req, res) => {
    try {
        const id = req.params.categoryId;
        const categoryData = await Category.findById(id);
        
        if (categoryData) {
            res.render('admin/editCategory', { category: categoryData });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateCate = async (req, res) => {
    try {
        const id = req.params.categoryId;
        const { name, description } = req.body;

        // Validate inputs
        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        if (!/^[A-Z][a-zA-Z\s]*$/.test(name)) {
            return res.status(400).json({ message: 'Name should start with a capital letter and contain only letters and spaces' });
        }

        if (name.length < 3) {
            return res.status(400).json({ message: 'Name must be at least 3 characters long' });
        }

        if (description.length < 50) {
            return res.status(400).json({ message: 'Description must be at least 50 characters long' });
        }

        const existingCategory = await Category.findOne({ 
            name: name.toLowerCase(),
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category name already exists' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { 
                name: name,
                description: description
            },
            { new: true }
        );

        if (updatedCategory) {
            res.status(200).json({ message: 'Category updated successfully' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.categoryId;
        const category = await Category.findByIdAndUpdate(
            id,
            { is_active: false },
            { new: true }
        );

        if (category) {
            res.status(200).json({ message: 'Category deleted successfully' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const restoreCategory = async (req, res) => {
    try {
        const id = req.params.categoryId;
        const category = await Category.findByIdAndUpdate(
            id,
            { is_active: true },
            { new: true }
        );

        if (category) {
            res.status(200).json({ message: 'Category restored successfully' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    createCategory,
    loadCategory,
    editCategoryLoad,
    updateCate,
    deleteCategory,
    restoreCategory
};
