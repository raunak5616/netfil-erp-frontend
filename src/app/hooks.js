import { useDispatch, useSelector } from 'react-redux';

/**
 * Custom Redux hooks for standard, typed-ready selector and dispatch usage
 * across components and pages.
 */
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
