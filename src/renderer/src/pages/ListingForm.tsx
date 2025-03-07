import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface IValue {
    description: string;
}

const ListingForm = () => {
    const initialValues: IValue = {
        description: '',
    };

    const onSubmit = (values: IValue) => {
        console.log('values', values);
        console.log(window.electron);
        // This is a typescript error, otherwise works fine
        window.electron.send('submit:todoForm', values);
    };

    const validationSchema = Yup.object().shape({
        description: Yup.string().required(),
    });

    return(
        <div>
            <Formik 
                initialValues={initialValues} 
                onSubmit={onSubmit} 
                validationSchema={validationSchema}
                >
                <Form>
                    <div>   
                        <Field name="description" id="description" />
                        <ErrorMessage name="description" />
                    </div>
                    <button type="submit">Save</button>
                </Form>
            </Formik>
        </div>
    )
};
export default ListingForm;