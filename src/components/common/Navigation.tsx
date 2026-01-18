'use client'

import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './Navigation.module.css';

interface NavigationProps {
    backTo?: string;
}

export default function Navigation({ backTo = '/' }: NavigationProps) {
    const { t } = useLanguage();
    return (
        <Link href={backTo} className={styles.navBack}>
            <IoArrowBack className={styles.icon} />
            {t('common.dashboard')}
        </Link>
    );
}
