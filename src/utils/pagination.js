
export const pagination = ({ page = 1, size = 3}={}) =>{
    if(page < 1) page =1;
    if(size < 1) size =3;

    //limit 
    const limit = size;
    // skip 
    const skip = (parseInt(page) -1) * parseInt(size);

    return {
        limit, 
        skip,
    }
}
export default pagination;